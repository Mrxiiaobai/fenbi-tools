import * as React from "react";
import { Button, Input } from "antd";
import { TMaterials, TQuestionItem, TSolutionItem } from "../types";
import { radioMap } from "../utils/constant";

type ShenlunRenderItem = TQuestionItem | TSolutionItem;

interface TShenlunItemProps {
  data: ShenlunRenderItem[];
  materials: TMaterials[];
  index: number;
  onChange: (text: string, item: ShenlunRenderItem, index: number) => void;
}

const { TextArea } = Input;
export const ShenlunItem = (props: TShenlunItemProps) => {
  const {
    data = [],
    materials = [],
    onChange,
    index,
  } = props;

  return (
    <div>
      {(materials || []).length > 0 && (
        <div
          dangerouslySetInnerHTML={{
            __html: materials?.[index]?.content || "",
          }}
        ></div>
      )}
      {data.map((ele: ShenlunRenderItem, index: number) => {
        return (
          <div className="question-item" key={ele.globalId || ele.id || index}>
            <span>{index + 1}、</span>
            <span
              dangerouslySetInnerHTML={{
                __html: ele.content,
              }}
            ></span>

            <div className="answer-item">
              {(ele.accessories || []).map((access, ind: number) => {
                return (
                  <TextArea
                    key={`${ele.globalId || ele.id || index}-${ind}`}
                    defaultValue={ele?.userAnswer?.answer || ""}
                    maxLength={access?.wordCount || undefined}
                    allowClear
                    placeholder="请输入答案..."
                    showCount
                    rows={6}
                    onBlur={(e) => {
                      onChange(e.target.value, ele, index);
                    }}
                  />
                );
              })}
            </div>

            {"solution" in ele && ele.solution && (
              <div className="solution-container">
                <p>
                  <span
                    className={
                      ele?.userAnswer?.choice === ele?.correctAnswer?.choice
                        ? "green"
                        : "red"
                    }
                    style={{
                      marginRight: "5px",
                    }}
                  >
                    你的答案：{radioMap[Number(ele?.userAnswer?.choice) + 1]}
                  </span>
                  <span className="green">
                    正确答案：{radioMap[Number(ele?.correctAnswer?.choice) + 1]}
                  </span>
                </p>
                <div style={{ fontWeight: "bold" }}>解析：</div>
                <div
                  className="solution"
                  dangerouslySetInnerHTML={{
                    __html: ele.solution,
                  }}
                ></div>
                {ele.keypoints && ele.keypoints.length > 0 && (
                  <div className="keypoints">
                    <span className="keypoints-label">考点：</span>
                    {ele.keypoints.map((kp) => (
                      <Button
                        key={kp.id}
                        size="small"
                        type="dashed"
                        style={{ margin: "4px 4px 0 0" }}
                      >
                        {kp.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
