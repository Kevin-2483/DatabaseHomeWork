import {
  Drawer,
  Space,
  Table,
  FloatButton,
  Switch,
  ColorPicker,
  Button,
  Form,
  Input,
  message,
  ConfigProvider,
  theme,
} from "antd";
import PropTypes from "prop-types";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import React, { useMemo, useState, useEffect } from "react";

export default function AddBG(props) {
  const { placement, wh, dataServer } = props;
  const [form] = Form.useForm();
  const [token, setToken] = useState(() => {
    // 从Cookie中读取令牌
    const storedToken = document.cookie.replace(
      /(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    return storedToken || "";
  });
  const { TextArea } = Input;
  const [colorHex, setColorHex] = useState("#1677ff");
  const [formatHex, setFormatHex] = useState("hex");
  const [colorEnabled, setColorEnabled] = useState(true);
  const hexString = useMemo(
    () => (typeof colorHex === "string" ? colorHex : colorHex.toHexString()),
    [colorHex]
  );
  const [refreshData, setRefreshData] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          // 可以在这里添加其他头部信息
        };
        const requestOptions = {
          method: "GET",
          headers: headers,
        };
        const response = await fetch(
          dataServer + "/backgroundmanagement",
          requestOptions
        );
        const jsonData = await response.json();

        setDataSource(
          jsonData.backgroundResults.map((item) => ({
            ...item,
            key: item.backgroundID.toString(), // 将 backgroundID 转为字符串，确保 key 为字符串类型
          }))
        );
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshData, dataServer]);

  const columns = [
    {
      title: "backgroundID",
      dataIndex: "backgroundID",
      key: "backgroundID",
      fixed: "left",
    },
    {
      title: "url",
      dataIndex: "url",
      key: "url",
    },
    {
      title: "alt",
      dataIndex: "alt",
      key: "alt",
    },
    {
      title: "color",
      dataIndex: "color",
      key: "color",
    },
    {
      title: "Action",
      dataIndex: "",
      key: "x",
      fixed: "right",
      render: (record) => (
        <Button type="link" onClick={() => onDel(record.key)}>
          Delete
        </Button>
      ),
    },
  ];
  if (error) {
    message.error("Token验证失败,正在返回登录", 5);
    return <p>Error: {error.message}</p>;
  }
  const onFinish = async (values) => {
    console.log("Success:", values);
    try {
      const response = await fetch(dataServer + "/backgroundmanagement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          backgroundID: values.backgroundID,
          url: values.url,
          alt: values.alt,
          color: colorEnabled ? hexString : "",
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        message.error(jsonData.message, 7);

        throw new Error(jsonData.message);
      } else {
        message.success("背景添加成功", 3);
        setRefreshData(!refreshData);
        setOpen(false);
      }
    } catch (error) {
      console.error("Error during POST request:", error);
    }
  };
  const onFinishFailed = (errorInfo) => {
    message.error(errorInfo);
    console.log("Failed:", errorInfo);
  };

  const showDrawer = () => {
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };
  const onDel = async (values) => {
    console.log("Success:", values);
    try {
      const response = await fetch(dataServer+"/deleteRecord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          id: values,
          table: "background",
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        message.error(jsonData.error, 7);

        throw new Error(jsonData.error);
      } else {
        message.success("删除成功", 3);
        setRefreshData(!refreshData);
      }
    } catch (error) {
      console.error("Error during POST request:", error);
    }
  };

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
        {/* <Flex
          style={{
            width: "100%",
            height: "100vh", // 或者适当的高度
            overflowY: "auto", // 启用纵向滚动
          }}
          vertical
        > */}
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          tooltip={"添加"}
          onClick={showDrawer}
          style={{
            right: 40,
            bottom: 170,
          }}
        />
        <Table
          zIndex={1}
          pagination={{ position: ["topRight"] }}
          dataSource={dataSource}
          columns={columns}
          scroll={{
            x: "20vh",
            y: "80vh",
          }}
          style={{ margin: "10px 10px 10px 10px" }}
        />
        <Drawer
          zIndex={2}
          title="添加背景"
          width={wh + "vw"}
          height={wh + "vh"}
          placement={placement}
          onClose={onClose}
          open={open}
          styles={{
            body: {
              paddingBottom: 80,
            },
          }}
          extra={
            <Space>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                key="submit"
                type="primary"
                onClick={() => form.submit()}
                loading={loading}
              >
                提交
              </Button>
            </Space>
          }
        >
          <Form
            form={form}
            name="AddBG"
            autoComplete="off"
            style={{
              //maxWidth: 600,
              width: "85%",
              margin: "10px 10px 10px 10px",
            }}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            <Form.Item
              label="背景 ID"
              name="backgroundID"
              rules={[
                {
                  required: true,
                  message: "Please input a New backgroundID!",
                },
              ]}
            >
              <Input showCount maxLength={255} />
            </Form.Item>
            <Form.Item
              label="url"
              name="url"
              rules={[
                {
                  required: false,
                  message: "Please input a url!",
                },
              ]}
            >
              <TextArea
                showCount
                maxLength={255}
                placeholder="Please input URL"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>

            <Form.Item
              label="alt"
              name="alt"
              rules={[
                {
                  required: false,
                  message: "Please input alt",
                },
              ]}
            >
              <Input showCount maxLength={255} />
            </Form.Item>
            <Form.Item
              label="颜色"
              name="color"
              rules={[
                {
                  required: false,
                  message: "Please input a color!",
                },
              ]}
            >
              <div>
                <Switch
                  checked={colorEnabled}
                  onChange={(checked) => setColorEnabled(checked)}
                  style={{ margin: "0px 0px 20px 0px" }}
                />
              </div>
              <ColorPicker
                format={formatHex}
                value={colorHex}
                onChange={setColorHex}
                onFormatChange={setFormatHex}
                showText={() => {
                  return <span>{hexString}</span>;
                }}
                disabled={!colorEnabled}
              />
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.url !== currentValues.url ||
                prevValues.alt !== currentValues.alt ||
                prevValues.color !== currentValues.color
              }
            >
              {({ getFieldsValue }) => {
                const values = getFieldsValue(["url", "alt", "color"]);
                const isAtLeastOneFilled = Object.values(values).some(
                  (value) => value !== undefined && value !== ""
                );

                return isAtLeastOneFilled ? null : (
                  <Form.Item
                    wrapperCol={{ span: 24 }}
                    help="url,alt,颜色请至少填写一个字段"
                    validateStatus="error"
                  />
                );
              }}
            </Form.Item>
            {/* <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{ margin: "0px 0px 10px 0px" }}
              >
                添加
              </Button>
            </Form.Item> */}
          </Form>
        </Drawer>
        {/* </Flex> */}
      </ConfigProvider>
    </>
  );
}

AddBG.propTypes = {
  placement: PropTypes.string.isRequired,
  wh: PropTypes.number.isRequired,
  dataServer: PropTypes.string.isRequired,
};