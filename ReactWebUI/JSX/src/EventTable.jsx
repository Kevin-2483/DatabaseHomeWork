import React, { useState, useEffect } from "react";
import {
  Button,
  Drawer,
  message,
  Form,
  Input,
  Table,
  ConfigProvider,
  theme,
} from "antd";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";


export default function EventTable(props) {


  
  const [childrenDrawer, setChildrenDrawer] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { placement, wh, Event, dataServer } = props;
  const navigate = useNavigate();
  const [preEvent, setPreEvent] = useState(-1);
  const [clickable, setClickable] = useState([]);
  const [isRoot, setIsRoot] = useState(true);
  const [token, setToken] = useState(() => {
    // 从Cookie中读取令牌
    const storedToken = document.cookie.replace(
      /(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    return storedToken || "";
  });
  const [rootEvent, setRootEvent] = useState("");
  useEffect(() => {
    if (Event >= 0) {
      setRootEvent(Event);
      setIsRoot(false);
    } else {
      setRootEvent("");
      setIsRoot(true);
    }
  }, [Event]);

  useEffect(() => {
    // 当令牌更新时，将其保存到Cookie中
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 3); // 设置过期时间

    document.cookie = `jwt=${token}; Expires=${expirationDate.toUTCString()}; Max-Age=259200;`;
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(dataServer + "/test/" + String(rootEvent));
        const jsonData = await response.json();

        setPreEvent(jsonData.PreEvent);

        setClickable(jsonData.combinedResults.eventsWithChildren);

        // 处理数据：将 EventID 重命名为 key
        const modifiedData = jsonData.combinedResults.parentEventDetails.map(
          (item) => {
            return {
              ...item,
              key: item.EventID,
              description: item.details,
            };
          }
        );

        setData(modifiedData);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rootEvent, dataServer]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }
  const Login = () => {
    navigate("/admin");
    props.onValueChange(-2);
  };

  const onFinish = async (values) => {
    console.log("Success:", values);
    try {
      const response = await fetch(dataServer+"/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          adminid: values.username,
          password: values.password,
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        if (jsonData.errorcode === 1) {
          message.error("用户名不存在",7);
        } else {
          message.error("密码不正确",7);
        }

        throw new Error("Network response was not ok");
      } else {
        console.log(jsonData.token);
        setToken(jsonData.token);
        message.success("登录成功,正在跳转", 2, Login);
      }
      

    } catch (error) {
      console.error("Error during POST request:", error);
    }
  };
  const onFinishFailed = (errorInfo) => {
    message.error(errorInfo);
    console.log("Failed:", errorInfo);
  };
  const columns = [
    {
      title: "EventID",
      dataIndex: "EventID",
      key: "EventID",
    },
    {
      title: "slide",
      dataIndex: "slide",
      key: "slide",
    },
    {
      title: "vendor",
      dataIndex: "vendor",
      key: "vendor",
    },
    {
      title: "guests",
      dataIndex: "guests",
      key: "guests",
    },
    {
      title: "Action",
      dataIndex: "",
      key: "x",
      render: (record) =>
        clickable.includes(record.key) ? (
          <Button type="link" onClick={() => props.onValueChange(record.key)}>
            查看子事件
          </Button>
        ) : (
          <Button type="link" disabled={true}>
            暂无子事件
          </Button>
        ),
    },
  ];


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
        <Table
          columns={columns}
          expandable={{
            expandedRowRender: (record) => (
              <p
                style={{
                  margin: 0,
                }}
              >
                {record.description}
              </p>
            ),
            rowExpandable: (record) => record.name !== "Not Expandable",
          }}
          dataSource={data}
          style={{ margin: "10px 10px 10px 10px" }}
        />
        <Button
          type="primary"
          onClick={() => props.onValueChange(preEvent)}
          disabled={isRoot}
          style={{ margin: "10px 10px 10px 10px" }}
        >
          preEvent
        </Button>
        <Button
          type="primary"
          style={{ margin: "10px 10px 10px 10px" }}
          onClick={() => setChildrenDrawer(true)}
        >
          admin login
        </Button>

        <Drawer
          title="Two-level Drawer"
          width={wh * 0.8 + "vw"}
          height={wh * 0.8 + "vh"}
          placement={placement}
          closable={true}
          onClose={() => setChildrenDrawer(false)}
          open={childrenDrawer}
          zIndex={2}
        >
          <Form
            layout="vertical"
            name="login"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              label="管理员ID"
              name="username"
              rules={[
                {
                  required: true,
                  message: "Please input your ID!",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                {
                  required: true,
                  message: "Please input your password!",
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                登录
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      </ConfigProvider>
    </>
  );
}

EventTable.propTypes = {
  placement: PropTypes.string.isRequired,
  wh: PropTypes.number.isRequired,
  onValueChange: PropTypes.func.isRequired,
  Event: PropTypes.number.isRequired,
  dataServer: PropTypes.string.isRequired, // 你可以根据实际情况更改类型
};
