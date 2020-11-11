// @ts-nocheck
import React from "react";
import styles from "./App.module.css";
import {
  getColonyNetworkClient,
  Network,
  getBlockTime,
  getLogs,
} from "@colony/colony-js";
import { Wallet } from "ethers";
import { InfuraProvider, Web3Provider } from "ethers/providers";
import { utils } from "ethers";
import { ListItem } from "./components/ListItem";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";
import detectEthereumProvider from "@metamask/detect-provider";

interface MyState {
  readonly eventsArray: object;
  loading: boolean;
}

export default class App extends React.Component<{}, MyState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      eventsArray: {},
      loading: true,
    };
  }

  componentDidMount() {
    this.getData();
  }

  getData = (): void => {
    (async (): Promise<object> => {
      const MAINNET_NETWORK_ADDRESS = `0x5346D0f80e2816FaD329F2c140c870ffc3c3E2Ef`;
      const MAINNET_BETACOLONY_ADDRESS = `0x869814034d96544f3C62DE2aC22448ed79Ac8e70`;

      //const provider = new InfuraProvider();
      // using MetaMask's provider due to issues with Infura

      const MetaMaskprovider = await detectEthereumProvider();
      const provider = new Web3Provider(MetaMaskprovider);

      const wallet = Wallet.createRandom();
      const connectedWallet = wallet.connect(provider);

      const networkClient = await getColonyNetworkClient(
        Network.Mainnet,
        connectedWallet,
        MAINNET_NETWORK_ADDRESS
      );

      const colonyClient = await networkClient.getColonyClient(
        MAINNET_BETACOLONY_ADDRESS
      );

      const payoutEventFilter = colonyClient.filters.PayoutClaimed();
      const initializedColonyEventFilter = colonyClient.filters.ColonyInitialised();
      const colonyRoleSetEventFilter = colonyClient.filters.ColonyRoleSet();
      const domainAddedEventFilter = colonyClient.filters.DomainAdded();

      const payoutEventLogs = await getLogs(colonyClient, payoutEventFilter);
      const initEventLogs = await getLogs(
        colonyClient,
        initializedColonyEventFilter
      );
      const colonyRoleEventLogs = await getLogs(
        colonyClient,
        colonyRoleSetEventFilter
      );
      const domainAddedEventLogs = await getLogs(
        colonyClient,
        domainAddedEventFilter
      );

      let parsedPayoutLogs = payoutEventLogs.map((event) =>
        colonyClient.interface.parseLog(event)
      );

      // Getting the userAddress for PayoutClaimed Events

      let parsedPayoutArray: Array = [];

      //This is to slow down requests in order to not hit Infura's Rate Limit
      const timeout = (ms) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
      };

      for (let log of parsedPayoutLogs) {
        //await timeout(700);
        let logObject: object = { ...log };
        const humanReadableFundingPotId = new utils.BigNumber(
          log.values.fundingPotId
        ).toString();

        const { associatedTypeId } = await colonyClient.getFundingPot(
          humanReadableFundingPotId
        );

        const { recipient: userAddress } = await colonyClient.getPayment(
          associatedTypeId
        );

        logObject["humanReadableFundingPotId"] = humanReadableFundingPotId;
        logObject["userAddress"] = userAddress;

        parsedPayoutArray.push(logObject);
      }

      let eventsLogs = [
        ...initEventLogs,
        ...colonyRoleEventLogs,
        ...domainAddedEventLogs,
      ];

      let parsedLogs = eventsLogs.map((event) =>
        colonyClient.interface.parseLog(event)
      );

      eventsLogs = [...eventsLogs, ...payoutEventLogs];
      parsedLogs = [...parsedLogs, ...parsedPayoutArray];

      let eventsArray: Array = [];

      for (let i = 0; i < parsedLogs.length; i++) {
        let objectToMap: object = {};

        const getDate = async (log4: object) => {
          const logTime = await getBlockTime(provider, log4.blockHash);
          return logTime;
        };

        if (i % 10 === 0) {
          //await timeout(500);
          let dateInMilliseconds = await getDate(eventsLogs[i]);
          objectToMap = { ...eventsLogs[i], ...parsedLogs[i] };
          objectToMap["date"] = dateInMilliseconds;
          eventsArray.push(objectToMap);
        } else {
          let dateInMilliseconds = await getDate(eventsLogs[i]);
          objectToMap = { ...eventsLogs[i], ...parsedLogs[i] };
          objectToMap["date"] = dateInMilliseconds;
          eventsArray.push(objectToMap);
        }
      }
      console.group();
      console.log("finished Fetching");
      console.groupEnd();
      eventsArray.sort(this.compareDates);

      return {
        eventsArray,
      };
    })()
      .then((res) =>
        this.setState({
          loading: false,
          eventsArray: res.eventsArray,
        })
      )
      .catch((error) => console.error(error));
  };

  getAddress = async (log1: object): string => {
    const humanReadableFundingPotId = new utils.BigNumber(
      log1.values.fundingPotId
    ).toString();

    const { associatedTypeId } = await colonyClient.getFundingPot(
      humanReadableFundingPotId
    );

    const { recipient: userAddress } = await colonyClient.getPayment(
      associatedTypeId
    );

    return { userAddress };
  };

  compareDates = (log2: object, log3: object): boolean => {
    let firstDate: object = new Date(log2.date);
    let secondDate: object = new Date(log3.date);

    if (firstDate.getTime() > secondDate.getTime()) {
      return -1;
    } else if (firstDate.getTime() < secondDate.getTime()) {
      return 1;
    } else {
      return 0;
    }
  };

  render() {
    const { eventsArray, loading } = this.state;
    return (
      <div className="App">
        <div className={styles.body}>
          <ul className={styles.event_list}>
            {loading ? (
              <Loader
                type="Bars"
                color="#00BFFF"
                height={100}
                width={100}
                className={styles.center}
              />
            ) : (
              <ListItem sortedData={eventsArray} />
            )}
          </ul>
        </div>
      </div>
    );
  }
}
