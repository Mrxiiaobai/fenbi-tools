import { Button, Flex } from "antd";
import * as React from "react";
import * as dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export const HistoryItem = (props: {
  data: any;
  goExercise: (data: any) => void;
}) => {
  const { data, goExercise } = props;

  const navigate = useNavigate();

  return (
    <div style={{ border: "1px solid #ffffff", borderRadius: 5, padding: 10 }}>
      <Flex justify="space-between" align="center">
        <div>
          <p>{data?.sheet?.name}</p>
          <p>{data?.sheet?.type == 1 ? "试卷" : "练习"}</p>
          <p>创建时间：{dayjs(data?.createTime).format("YYYY-MM-DD")}</p>
          <p>
            共{data?.questionCount}题,答对：{data?.correctCount}题
          </p>
        </div>
        <div>
          <Button
            type="primary"
            style={{ borderColor: "white" }}
            onClick={() => {
              if (data?.status == 1) {
                navigate("/answer", {
                  state: {
                    id: data?.id,
                    combineKey: data?.key,
                    type: data?.sheet?.type,
                  },
                });

                return;
              }
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
