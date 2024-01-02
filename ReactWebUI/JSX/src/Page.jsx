import TimeLine from "./TimeLine.jsx";
import EventManagement from "./eventmanagement.jsx";
import { useEffect, useState } from "react";
import { ConfigProvider, theme } from "antd";


export default function Page(value) {
  const { placement, wh, Event, dataServer } = value;
  const [rootEvent, setRootEvent] = useState('');
  useEffect(() => {
    if (Event >= 0) {
      setRootEvent(Event);
    } else {
      setRootEvent("");
    }
    
  }, [Event]);
  if (Event == -2) {
    return (
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
        <EventManagement
          placement={placement}
          wh={wh}
          dataServer={dataServer}
        />
      </ConfigProvider>
    );
  } else {
    
    return<ConfigProvider
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
      ><TimeLine Event={rootEvent} dataServer={dataServer} /></ConfigProvider>
    
  }
}