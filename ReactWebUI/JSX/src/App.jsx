import React, { useState, useEffect } from "react";
import {
  Input,
  Drawer,
  Radio,
  Space,
  Slider,
  Modal,
  ConfigProvider,
  theme,
} from "antd";
import { FloatButton, Button } from "antd";
import EventTable from "./EventTable.jsx";
import Admin from "./Admin.jsx";
import Page from "./Page.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App = () => {
  const [event, setEvent] = useState(-1);
  const [open, setOpen] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formatter = (value) => `${value}%`;

  const storedDataWh = parseInt(localStorage.getItem("myWh"), 10);
  const str = "top right bottom left";

  const storedDataPlacement = localStorage.getItem("myPlacement");
  
  const contains = str.includes(storedDataPlacement);

  const [placement, setPlacement] = useState(
    contains == false ? "left" : storedDataPlacement
  );
  const isInteger = !isNaN(storedDataWh);
  const isInRange = isInteger && storedDataWh >= 20 && storedDataWh <= 100;
  const [wh, setWh] = useState(isInRange == false ? 90 : storedDataWh);

  const storedDataServer = localStorage.getItem("myDataServer");
  const [dataServer, setDataServer] = useState(
    storedDataServer == null ? "http://127.0.0.1:3000" : storedDataServer
  );

  useEffect(() => {
    localStorage.setItem("myWh", wh);
    localStorage.setItem("myPlacement", placement);
    localStorage.setItem("myDataServer", dataServer);
  }, [wh, placement, dataServer]);

  // 定义回调函数，该函数将被传递给 EventTable
  const handleValueChange = (value) => {
    // 在这里处理从 EventTable 传递回来的值
    setEvent(value);
  };
  useEffect(() => {
    setOpen(false);
  }, [event]);

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
        <Page
          Event={event}
          placement={placement}
          wh={wh}
          dataServer={dataServer}
        />

        <div>
          <Space>
            <FloatButton
              onClick={() => setOpen(!open)}
              open
              style={{
                right: 40,
                bottom: 100,
              }}
            />
          </Space>
        </div>

        <Drawer
          title="Basic Drawer"
          closable={true}
          onClose={() => setOpen(false)}
          open={open}
          key={placement}
          width={wh + "vw"}
          height={wh + "vh"}
          placement={placement}
          zIndex={2}
          extra={
            <Space>
              <Button type="primary" onClick={() => setIsModalOpen(true)}>
                Setting
              </Button>
            </Space>
          }
        >
          <Router>
            <Routes>
              <Route
                path="/"
                exact
                element={
                  <EventTable
                    placement={placement}
                    wh={wh}
                    Event={event}
                    dataServer={dataServer}
                    onValueChange={handleValueChange}
                  />
                }
              />

              <Route
                path="/admin"
                element={
                  <Admin
                    placement={placement}
                    wh={wh}
                    onValueChange={handleValueChange}
                    dataServer={dataServer}
                  />
                }
              />
            </Routes>
          </Router>
        </Drawer>

        <Modal
          title="Setting"
          open={isModalOpen}
          closable={false}
          zIndex={3}
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
          <h4>抽屉位置:</h4>
          <Radio.Group
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="top">top</Radio.Button>
            <Radio.Button value="right">right</Radio.Button>
            <Radio.Button value="bottom">bottom</Radio.Button>
            <Radio.Button value="left">left</Radio.Button>
          </Radio.Group>
          <h4>抽屉大小:</h4>
          <Slider
            tooltip={{ formatter }}
            defaultValue={wh}
            onChange={(newValue) => setWh(newValue)}
            min={20}
          />
          <h4>Server URL:</h4>
          <Input
            value={dataServer}
            onChange={(e) => setDataServer(e.target.value)}
          ></Input>
        </Modal>
      </ConfigProvider>
    </>
  );
};
export default App;
