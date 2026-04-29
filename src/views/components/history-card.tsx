import * as React from "react";
import { Button, Flex } from "antd";
import * as dayjs from "dayjs";
import { HistoryExercise } from "../types";

export const HistoryCard = (props: {
  onClick?: () => void | undefined;
  data: HistoryExercise[];
  goExercise: (data: HistoryExercise) => void;
}) => {
  const { onClick, data, goExercise } = props;

  const _data = data.find((item) => item.status == 0 && item.sheet?.type == 3);

  return (
    <div style={{ border: "1px solid #ffffff", borderRadius: 5, padding: 10 }}>
      <Flex justify="space-between" align="center">
        <span>练习历史</span>
        <Button
          type="primary"
          style={{ borderColor: "white" }}
          onClick={onClick}
        >
          全部（最近15条）
        </Button>
      </Flex>
      {_data?.status == 0 && _data?.sheet?.type == 3 ? (
        <div>
          <p>{_data?.sheet?.name}</p>
          {/* <p>{_data?.sheet?.type == 1 ? "试卷" : "练习"}</p> */}
          <p>创建时间：{dayjs(_data?.createTime).format("YYYY-MM-DD")}</p>
          <Button
            type="primary"
            style={{ borderColor: "white" }}
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
