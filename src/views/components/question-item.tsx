import * as React from "react";
import { TMaterials, TQuestionItem, TSolutionItem } from "../types";
import { Radio, RadioChangeEvent } from "antd";
import { radioMap } from "../utils/constant";
import { ThemeContext } from "../context/themeContext";
import { setImg } from "../utils/setImg";

interface TQuestionItemProps {
  data: TSolutionItem[];
  materials: TMaterials[];
  index: number;
  onChange: (e: RadioChangeEvent, item: TSolutionItem, index: number) => void;
}
export const QuestionItem = (props: TQuestionItemProps) => {
  const { data = [], materials = [], onChange, index } = props;

  return (
    <div>
      {/* {(materials || []).length > 0 && (
        <div
          key={index}
          dangerouslySetInnerHTML={{
            __html: setImg(materials?.[index]?.content),
          }}
        ></div>
      )} */}
      {(data || []).map((ele: TSolutionItem, index: number) => {
        return (
          <div>
            {(materials || []).length > 0 && (
              <div
                key={index}
                dangerouslySetInnerHTML={{
                  __html: setImg(materials?.[index]?.content),
                }}
              ></div>
            )}
            <div className="question-item">
              <span>{index + 1}、</span>
              <span
                dangerouslySetInnerHTML={{
                  __html: setImg(ele.content),
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
                          const newOption = setImg(option);
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
                      正确答案：
                      {radioMap[Number(ele?.correctAnswer?.choice) + 1]}
                    </span>
                  </p>
                  <div className="green" style={{ fontWeight: "bold" }}>
                    解析：
                  </div>
                  <div
                    className="solution"
                    dangerouslySetInnerHTML={{
                      __html: setImg(ele.solution),
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
