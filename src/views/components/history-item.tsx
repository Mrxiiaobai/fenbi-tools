import { Button, Flex } from "antd";
import * as React from "react";
import * as dayjs from "dayjs";

export const HistoryItem = (props: {
  data: any;
  goExercise: (data: any) => void;
}) => {
  const { data, goExercise } = props;

  return (
    <div style={{ border: "1px solid #ffffff", borderRadius: 5, padding: 10 }}>
      <Flex justify="space-between" align="center">
        <div>
          <p>{data?.sheet?.name}</p>
          <p>{data?.sheet?.type == 1 ? "试卷" : "练习"}</p>
          <p>创建时间：{dayjs(data?.createTime).format("YYYY-MM-DD")}</p>
        </div>
        <div>
          <Button
            type="primary"
            style={{ borderColor: "white" }}
            onClick={() => {
              if (data?.status == 1) return;
              goExercise(data);
            }}
          >
            {data?.status == 1 ? "已完成" : "继续做题"}
          </Button>
        </div>
      </Flex>
    </div>
  );
};
