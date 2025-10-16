import * as React from "react";
import { TMaterials, TQuestionItem, TSolutionItem } from "../types";
import { Input, Radio, RadioChangeEvent } from "antd";
import { radioMap } from "../utils/constant";
import { ThemeContext } from "../context/themeContext";

interface TShenlunItemProps {
  data: TSolutionItem[];
  materials: TMaterials[];
  index: number;
  onChange: (e: string) => void;
}

const { TextArea } = Input;
export const ShenlunItem = (props: TShenlunItemProps) => {
  const { data = [], materials = [], onChange, index } = props;

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
        console.log("🚀 ~ ShenlunItem ~ ele:", ele);
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
                  <TextArea
                    defaultValue={ele.userAnswer.answer}
                    maxLength={access.wordCount}
                    allowClear
                    placeholder="请输入答案..."
                    showCount
                    rows={6}
                    onBlur={(e) => {
                      onChange(e.target.value);
                    }}
                  />
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
