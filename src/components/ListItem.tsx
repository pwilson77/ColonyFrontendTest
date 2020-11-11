// @ts-nocheck
import React from "react";
import styles from "../App.module.css";
import { ColonyRole } from "@colony/colony-js";
import { utils } from "ethers";
import Blockies from "react-blockies";

interface Props {
  sortedData: any;
}

const dateConversion = (val: number): string => {
  let date: Date = new Date(val);
  return `${date.getDate()}, ${date.toLocaleString("default", {
    month: "short",
  })} `;
};

const myBlockies = (address: string) => (
  <Blockies
    seed={address}
    size={12.33}
    scale={3}
    spotColor="#abc"
    className={styles.avatar}
  />
);

const getValue = (hexval: string): string => {
  const humanReadableAmount = new utils.BigNumber(hexval);
  const wei = new utils.BigNumber(10);
  const convertedAmount = humanReadableAmount.div(wei.pow(18));
  return convertedAmount.toString();
};

const getDomainId = (hexval: string): string => {
  const humanReadableAmount = new utils.BigNumber(hexval);
  return humanReadableAmount.toString();
};

const getToken = (log: object): string => {
  const tokens: object = {
    "0x6B175474E89094C44Da98b954EedeAC495271d0F": "DAI",
    "0x0dd7b8f3d1fa88FAbAa8a04A0c7B52FC35D4312c": "BLNY",
  };

  if (log.values.token in tokens) {
    return tokens[log.values.token];
  } else {
    console.log(log.values.token);
    return "";
  }
};

const PaymentConfirmationListItem: React.FunctionComponent<{
  data: object;
}> = ({ data }) => (
  <li className={styles.list_item}>
    {myBlockies(data.userAddress)}

    <div className={styles.text_container}>
      <p className={styles.block_info}>
        User <b>{`${data.userAddress}`}</b> claimed
        <b>{` ${getValue(data.values.amount._hex)} ${getToken(data)} `}</b>
        payout from pot <b>{` ${data.humanReadableFundingPotId} `}</b>
      </p>
      <p className={styles.date}>{dateConversion(data.date)}</p>
    </div>
  </li>
);

const ColonyInitialisedListItem: React.FunctionComponent<{
  data: object;
}> = ({ data }) => (
  <li className={styles.list_item}>
    {myBlockies(data.address)}
    <div className={styles.text_container}>
      <p className={styles.block_info}>
        Congratulations! It's a beautiful baby colony!
      </p>
      <p className={styles.date}>{dateConversion(data.date)}</p>
    </div>
  </li>
);

const ColonyRoleSetListItem: React.FunctionComponent<{
  data: object;
}> = ({ data }) => (
  <li className={styles.list_item}>
    {myBlockies(data.values.user)}

    <div className={styles.text_container}>
      <p className={styles.block_info}>
        <b>{` ${ColonyRole[`${data.values.role}`]} `}</b>
        role assigned to user
        <b>{` ${data.values.user} `}</b>
        in domain
        <b>{` ${getDomainId(data.values.domainId._hex)} `}</b>
      </p>
      <p className={styles.date}>{dateConversion(data.date)}</p>
    </div>
  </li>
);

const DomainAddedListItem: React.FunctionComponent<{
  data: object;
}> = ({ data }) => (
  <li className={styles.list_item}>
    {myBlockies(data.address)}

    <div className={styles.text_container}>
      <p className={styles.block_info}>
        Domain <b>{` ${getDomainId(data.values.domainId._hex)} `}</b> added
      </p>
      <p className={styles.date}>{dateConversion(data.date)}</p>
    </div>
  </li>
);

export const ListItem: React.FC<Props> = ({ sortedData }) => {
  return sortedData.map((data, i) => {
    if (data.name === "PayoutClaimed") {
      return <PaymentConfirmationListItem data={data} key={i} />;
    } else if (data.name === "ColonyInitialised") {
      return <ColonyInitialisedListItem data={data} key={i} />;
    } else if (data.name === "ColonyRoleSet") {
      return <ColonyRoleSetListItem data={data} key={i} />;
    } else if (data.name === "DomainAdded") {
      return <DomainAddedListItem data={data} key={i} />;
    }
  });
};
