import * as React from "react";
import { TMaterials, TQuestionItem, TSolutionItem } from "../types";
import { Button, Radio, RadioChangeEvent, Space } from "antd";
import { radioMap } from "../utils/constant";
import { ThemeContext } from "../context/themeContext";
import { setImg } from "../utils/setImg";
import { useSetting } from "../components/hooks";

interface TQuestionItemProps {
  data: TSolutionItem[];
  materials: TMaterials[];
  index: number;
  onChange: (e: RadioChangeEvent, item: TSolutionItem, index: number) => void;
}
export const QuestionItem = (props: TQuestionItemProps) => {
  const { data = [], materials = [], onChange, index } = props;

  const [excludeMap, setExcludeMap] = React.useState<Record<string, boolean>>(
    {},
  );

  const { setting } = useSetting();

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
              <span>
                {index + 1}、<span>单选题</span>
              </span>
              <div
                dangerouslySetInnerHTML={{
                  __html: setImg(ele.content),
                }}
              ></div>

              <div className="answer-item">
                {(ele.accessories || []).map((access: any, ind: number) => {
                  return (
                    <Radio.Group
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        // gap: 8,
                      }}
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
                        (option: any, index2: number) => {
                          const newOption = setImg(option);
                          const key = `${index}-${ind}-${index2}`;
                          const excluded = excludeMap[key];
                          return (
                            <Space style={{ justifyContent: "space-between" }}>
                              <Radio value={index2}>
                                <div
                                  style={{
                                    textDecoration: excluded
                                      ? "line-through"
                                      : "",
                                  }}
                                >
                                  <span>{radioMap[index2 + 1]}、</span>
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: newOption,
                                    }}
                                  ></span>
                                </div>
                              </Radio>
                              {setting.needLineThrough ? (
                                <Button
                                  size="small"
                                  onClick={() => {
                                    const key = `${index}-${ind}-${index2}`;
                                    setExcludeMap((prev) => ({
                                      ...prev,
                                      [key]: excluded ? false : true,
                                    }));
                                  }}
                                >
                                  {excluded ? "重置" : "排除"}
                                </Button>
                              ) : (
                                <></>
                              )}
                            </Space>
                          );
                        },
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
