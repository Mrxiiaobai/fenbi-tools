import * as React from "react";
import { TMaterials, TQuestionItem, TSolutionItem } from "../types";
import { Radio, RadioChangeEvent } from "antd";
import { radioMap } from "../utils/constant";
import { ThemeContext } from "../context/themeContext";

interface TQuestionItemProps {
  data: TSolutionItem[];
  materials: TMaterials[];
  index: number;
  onChange: (e: RadioChangeEvent, item: TSolutionItem, index: number) => void;
}
export const QuestionItem = (props: TQuestionItemProps) => {
  const { data = [], materials = [], onChange, index } = props;

  const { color } = React.useContext(ThemeContext);
  return (
    <div>
      {(materials || []).length > 0 && (
        <div
          dangerouslySetInnerHTML={{
            __html: materials?.[index].content,
          }}
        ></div>
      )}
      {(data || []).map((ele: TSolutionItem, index: number) => {
        return (
          <div className="question-item">
            <span>{index + 1}、</span>
            <span
              dangerouslySetInnerHTML={{
                __html: ele.content,
              }}
            ></span>

            <div className="answer-item">
              {(ele.accessories || []).map((access: any, ind: number) => {
                return (
                  <Radio.Group
                    onChange={(e) => {
                      onChange(e, ele, index);
                    }}
                    defaultValue={
                      ele?.userAnswer?.choice
                        ? Number(ele?.userAnswer?.choice)
                        : undefined
                    }
                  >
                    {(access?.options || []).map(
                      (option: any, index: number) => {
                        const newOption = option.replace(
                          /(<img[^>]+src=\")([^"]+)/g,
                          function (match: any, p1: string, p2: string) {
                            // 如果 src 已经包含 https:，则不修改
                            if (p2.startsWith("https:")) {
                              return p1 + p2;
                            }
                            // 如果没有 https:，则添加
                            return p1 + "https:" + p2;
                          }
                        );
                        return (
                          <Radio value={index}>
                            <div>
                              <span>{radioMap[index + 1]}、</span>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: newOption,
                                }}
                              ></span>
                            </div>
                          </Radio>
                        );
                      }
                    )}
                  </Radio.Group>
                );
              })}
            </div>

            {ele?.solution && (
              <>
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
                <span style={{ fontWeight: "bold" }}>解析：</span>
                <div
                  className="solution"
                  dangerouslySetInnerHTML={{
                    __html: ele.solution,
                  }}
                ></div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
