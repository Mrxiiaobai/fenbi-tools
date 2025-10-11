import { Radio, RadioChangeEvent, Modal, Button, Flex } from "antd";
import * as React from "react";
import * as dayjs from "dayjs";

export const HistoryCard = (props: {
  onClick?: () => void | undefined;
  data: any[];
  goExercise: (data: any) => void;
}) => {
  const { onClick, data, goExercise } = props;

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
      {data?.[0]?.status == 0 && data?.[0]?.sheet?.type == 3 ? (
        <div>
          <p>{data?.[0]?.sheet?.name}</p>
          {/* <p>{data?.[0]?.sheet?.type == 1 ? "试卷" : "练习"}</p> */}
          <p>创建时间：{dayjs(data?.[0]?.createTime).format("YYYY-MM-DD")}</p>
          <Button
            type="primary"
            style={{ borderColor: "white" }}
            onClick={() => {
              if (data?.[0]?.status == 1) return;
              goExercise(data);
            }}
          >
            {data?.[0]?.status == 1 ? "已完成" : "继续做题"}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
