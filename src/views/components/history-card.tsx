import * as React from "react";
import { Button, Flex } from "antd";
import { HistoryExercise } from "../types";

const formatDate = (value?: number | string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const HistoryCard = (props: {
  onClick?: () => void | undefined;
  data: HistoryExercise[];
  goExercise: (data: HistoryExercise) => void;
}) => {
  const { onClick, data, goExercise } = props;

  const _data = data.find(
    (item) => item?.status == 0 && item?.sheet?.type <= 3,
  );
  console.log("🚀 ~ HistoryCard ~ _data:", _data);

  return (
    <div
      className="card-border"
      style={{
        border: "1px solid var(--card-border-color)",
        borderRadius: 5,
        padding: 10,
      }}
    >
      <Flex justify="space-between" align="center">
        <span>练习历史</span>
        <Button
          type="primary"
          style={{ borderColor: "var(--button-border-color)" }}
          onClick={onClick}
        >
          全部（最近15条）
        </Button>
      </Flex>
      {_data?.status == 0 && _data?.sheet?.type <= 3 ? (
        <div>
          <p>{_data?.sheet?.name}</p>
          {/* <p>{_data?.sheet?.type == 1 ? "试卷" : "练习"}</p> */}
          <p>创建时间：{formatDate(_data?.createTime)}</p>
          <Button
            type="primary"
            style={{ borderColor: "var(--button-border-color)" }}
            onClick={() => {
              goExercise(_data);
            }}
          >
            继续做题
          </Button>
        </div>
      ) : null}
    </div>
  );
};
