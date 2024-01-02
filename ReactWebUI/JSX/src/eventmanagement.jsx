import React, { useState, useEffect } from "react";
import { Radio, Switch, Tabs, Button, Modal, Flex, ConfigProvider, theme } from "antd";
import Addbg from "./addbg.jsx";
import AddMedia from "./addmedia.jsx";
import AddED from "./eventdetails.jsx";
import AddSlide from "./AddSlide.jsx"
import EventsTree from "./eventstree.jsx";
import Date from "./Date.jsx"
import TextTable from "./TextTable.jsx"
import PropTypes from "prop-types";
const App = (props) => {
  const { placement, wh, dataServer } = props;
  const [tabPosition, setTabPosition] = useState("left");
  const [center, setCenter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const operations = (
    <Button
      type="primary"
      style={{ margin: "10px 10px 10px 10px" }}
      onClick={() => setIsModalOpen(true)}
    >
      Setting
    </Button>
  );
  return (
    <>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#e6c06c",
            colorInfo: "#e6c06c",
            colorSuccess: "#a4f97b",
            colorError: "#f96da1",
            colorWarning: "#f7f976",
            colorLink: "#66fdf3",
            colorBgBase: "#222222",
            wireframe: false,
          },
          algorithm: theme.darkAlgorithm,
        }}
      >
        <Flex
          style={{
            width: "100vw",
            height: "100vh",
            borderRadius: 6,
            border: "0px solid #40a9ff",
          }}
          justify={"space-evenly"}
          align={"flex-start"}
          vertical
        >
          <Tabs
            forceRender={false}
            destroyInactiveTabPane={true}
            style={{
              borderRadius: 6,
              border: "0px solid #40a9ff",
              width: "98vw",
              height: "98vh",
              margin: "1vh 1vw 1vh 1vw",
            }}
            tabPosition={tabPosition}
            tabBarExtraContent={operations}
            centered={center}
            items={new Array(7).fill(null).map((_, i) => {
              const id = String(i + 1);
              let component;
              let tab;

              // 根据标签索引i选择要渲染的组件
              switch (i) {
                case 0:
                  component = (
                    <Addbg
                      placement={placement}
                      wh={wh}
                      dataServer={dataServer}
                    />
                  );
                  tab = "添加背景";
                  break;
                case 1:
                  component = (
                    <AddMedia
                      placement={placement}
                      wh={wh}
                      dataServer={dataServer}
                    />
                  );
                  tab = "添加封面";
                  break;
                case 2:
                  component = (
                    <AddED
                      placement={placement}
                      wh={wh}
                      dataServer={dataServer}
                    />
                  );
                  tab = "添加信息";
                  break;
                case 3:
                  component = (
                    <AddSlide
                      placement={placement}
                      wh={wh}
                      dataServer={dataServer}
                    />
                  );
                  tab = "合成事件";
                  break;
                case 4:
                  component = <EventsTree dataServer={dataServer} />;
                  tab = "日程树";
                  break;
                case 5:
                  component = <Date dataServer={dataServer} />;
                  tab = "Date";
                  break;
                case 6:
                  component = <TextTable dataServer={dataServer} />;
                  tab = "Text";
                  break;
                default:
                  component = null;
              }

              return {
                label: tab || "空",
                key: id,
                children: component,
              };
            })}
          />
        </Flex>

        <Modal
          title="Setting"
          open={isModalOpen}
          closable={false}
          footer={[
            <Button
              key="OK"
              type="primary"
              onClick={() => setIsModalOpen(false)}
            >
              OK
            </Button>,
          ]}
        >
          <h4>Tab position:</h4>
          <Radio.Group
            value={tabPosition}
            onChange={(e) => setTabPosition(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="top">top</Radio.Button>
            <Radio.Button value="bottom">bottom</Radio.Button>
            <Radio.Button value="left">left</Radio.Button>
            <Radio.Button value="right">right</Radio.Button>
          </Radio.Group>
          <h4>setCenter:</h4>
          <Switch defaultValue={center} onChange={(bool) => setCenter(bool)}>
            setCenter
          </Switch>
        </Modal>
      </ConfigProvider>
    </>
  );
};
export default App;

App.propTypes = {
  placement: PropTypes.string.isRequired,
  wh: PropTypes.number.isRequired,
  dataServer: PropTypes.string.isRequired,
};
