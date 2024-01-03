import {
  Drawer,
  Space,
  Table,
  FloatButton,
  Flex,
  Button,
  Form,
  Input,
  message,
  ConfigProvider,
  theme
} from "antd";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import { PlusOutlined } from "@ant-design/icons";
export default function AddED(props) {
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
          dataServer+"/eventdetails",
          requestOptions
        );
        const jsonData = await response.json();

        setDataSource(
          jsonData.detailsResults.map((item) => ({
            ...item,
            key: item.slideID.toString(), // 将 backgroundID 转为字符串，确保 key 为字符串类型
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
      title: "slideID",
      dataIndex: "slideID",
      key: "slideID",
      fixed: "left",
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
      title: "details",
      dataIndex: "details",
      key: "details",
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
      const response = await fetch(dataServer+"/eventdetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          Slides_unique_id: values.Slides_unique_id,
          vendor: values.vendor,
          guests: values.guests,
          details: values.details,
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        message.error(jsonData.error, 7);

        throw new Error(jsonData.error);
      } else {
        message.success(jsonData.message, 3);
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
          table: "event_details",
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
        <Drawer
          zIndex={2}
          width={wh + "vw"}
          height={wh + "vh"}
          placement={placement}
          title="添加信息"
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
            name="AddED"
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
              label="事件ID"
              name="Slides_unique_id"
              rules={[
                {
                  required: true,
                  message: "Please input a 事件ID!",
                },
              ]}
            >
              <Input showCount maxLength={255} />
            </Form.Item>
            <Form.Item
              label="vendor"
              name="vendor"
              rules={[
                {
                  required: false,
                  message: "Please input vendor!",
                },
              ]}
            >
              <TextArea
                showCount
                maxLength={255}
                placeholder="Please input vendor"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>

            <Form.Item
              label="guests"
              name="guests"
              rules={[
                {
                  required: false,
                  message: "Please input guests",
                },
              ]}
            >
              <TextArea
                showCount
                maxLength={255}
                placeholder="Please input guests"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>
            <Form.Item
              label="details"
              name="details"
              rules={[
                {
                  required: false,
                  message: "Please input details",
                },
              ]}
            >
              <TextArea
                showCount
                placeholder="Please input details"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>

            {/* <Form.Item
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
                help="请至少填写一个字段"
                validateStatus="error"
              />
            );
          }}
        </Form.Item> */}
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
        <Table
          zIndex={1}
          dataSource={dataSource}
          columns={columns}
          scroll={{
            x: "20vh",
            y: "80vh",
          }}
          pagination={{ position: ["topRight"] }}
          style={{ margin: "10px 10px 10px 10px" }}
        />
        {/* </Flex> */}
      </ConfigProvider>
    </>
  );
}

AddED.propTypes = {
  placement: PropTypes.string.isRequired,
  wh: PropTypes.number.isRequired,
  dataServer: PropTypes.string.isRequired,
};