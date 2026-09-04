import * as React from "react";
import { Button, Checkbox, Radio, RadioChangeEvent, Space } from "antd";
import { TMaterials, TQuestionItem, TSolutionItem } from "../types";
import { radioMap } from "../utils/constant";
import { setImg } from "../utils/setImg";
import { useSetting } from "../components/hooks";
import { normalizeChoice, parseChoiceIndexes } from "../../shared/answerChoice";

type QuestionRenderItem = TQuestionItem | TSolutionItem;

interface TQuestionItemProps {
  data: QuestionRenderItem[];
  materials: TMaterials[];
  index: number;
  onChange: (
    e: RadioChangeEvent,
    item: QuestionRenderItem,
    index: number,
  ) => void;
  questionNumberOffset?: number;
}

const createAnswerChangeEvent = (value: number | string) => {
  return { target: { value } } as RadioChangeEvent;
};

const getChoiceText = (choiceIndex: number) => {
  return radioMap[choiceIndex + 1] || String(choiceIndex + 1);
};

const getChoiceLabel = (
  choice: string | number | undefined,
  multiple: boolean,
) => {
  return parseChoiceIndexes(choice, multiple).map(getChoiceText).join("、");
};

export const QuestionItem = (props: TQuestionItemProps) => {
  const {
    data = [],
    materials = [],
    onChange,
    index: _index,
    questionNumberOffset = 0,
  } = props;

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
      {data.map((ele: QuestionRenderItem, index: number) => {
        const isMultiple = ele.type === 2;
        const questionTypeText = isMultiple ? "多选题" : "单选题";
        const userChoice = ele?.userAnswer?.choice;
        const correctChoice = ele?.correctAnswer?.choice;
        const userChoiceLabel = getChoiceLabel(userChoice, isMultiple);
        const correctChoiceLabel = getChoiceLabel(correctChoice, isMultiple);
        const isCorrect = userChoice === correctChoice;

        return (
          <div key={ele.globalId || ele.id || index}>
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
                {questionNumberOffset + index + 1}、
                <span>{questionTypeText}</span>
              </span>
              <div
                dangerouslySetInnerHTML={{
                  __html: setImg(ele.content),
                }}
              ></div>

              <div className="answer-item">
                {(ele.accessories || []).map((access, ind: number) => {
                  const groupKey = `${ele.globalId || ele.id || index}-${ind}`;
                  const groupStyle: React.CSSProperties = {
                    display: "flex",
                    flexDirection: "column",
                    // gap: 8,
                  };
                  const options = (access?.options || []).map(
                    (option, index2: number) => {
                      const newOption = setImg(option);
                      const key = `${index}-${ind}-${index2}`;
                      const excluded = excludeMap[key];

                      return (
                        <Space
                          key={key}
                          style={{ justifyContent: "space-between" }}
                        >
                          {isMultiple ? (
                            <Checkbox value={index2}>
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
                            </Checkbox>
                          ) : (
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
                          )}
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
                  );

                  if (isMultiple) {
                    return (
                      <Checkbox.Group
                        key={groupKey}
                        style={groupStyle}
                        onChange={(checkedValues) => {
                          onChange(
                            createAnswerChangeEvent(
                              normalizeChoice(checkedValues, true),
                            ),
                            ele,
                            index,
                          );
                        }}
                        defaultValue={parseChoiceIndexes(userChoice, true)}
                      >
                        {options}
                      </Checkbox.Group>
                    );
                  }

                  return (
                    <Radio.Group
                      key={groupKey}
                      style={groupStyle}
                      onChange={(e) => {
                        onChange(e, ele, index);
                      }}
                      defaultValue={parseChoiceIndexes(userChoice)[0]}
                    >
                      {options}
                    </Radio.Group>
                  );
                })}
              </div>

              {"solution" in ele && ele.solution && (
                <div className="solution-container">
                  <p>
                    {ele?.userAnswer?.choice !== undefined && (
                      <span
                        className={isCorrect ? "green" : "red"}
                        style={{
                          marginRight: "5px",
                        }}
                      >
                        你的答案：{userChoiceLabel}
                      </span>
                    )}
                    <span className="green">
                      正确答案：{correctChoiceLabel}
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
