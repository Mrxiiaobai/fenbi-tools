import { Radio, RadioChangeEvent, Modal, Button } from "antd";
import * as React from "react";

export const QuestionCount = (props: {
  onChange?: ((e: number) => void) | undefined;
}) => {
  const { onChange } = props;
  const [open, setOpen] = React.useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = React.useState<number>(-1);

  const onRaioChange = (e: RadioChangeEvent) => {
    console.log("onRaioChange ~ e:", e);
    setCurrentIndex(e.target.value);
  };

  const onCancel = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button
        type="primary"
        style={{ borderColor: "#ffffff" }}
        onClick={() => setOpen(true)}
      >
        设置每组出题数量
      </Button>
      <Modal
        open={open}
        title="设置"
        onOk={() => {
          console.log("🚀 ~ currentIndex:", currentIndex);
          if (currentIndex > -1) {
            onChange && onChange(currentIndex);
            onCancel();
          }
        }}
        onCancel={onCancel}
      >
        <div>
          <span>可设置每组出题数量（ps: 不查询之前设置）</span>
          <Radio.Group onChange={onRaioChange}>
            <Radio.Button value={5}>5</Radio.Button>
            <Radio.Button value={10}>10</Radio.Button>
            <Radio.Button value={15}>15</Radio.Button>
            <Radio.Button value={20}>20</Radio.Button>
            <Radio.Button value={25}>25</Radio.Button>
            <Radio.Button value={30}>30</Radio.Button>
            <Radio.Button value={35}>35</Radio.Button>
            <Radio.Button value={40}>40</Radio.Button>
          </Radio.Group>
        </div>
      </Modal>
    </div>
  );
};
