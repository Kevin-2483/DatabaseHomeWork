import {
  Drawer,
  Space,
  FloatButton,
  Table,
  Flex,
  Button,
  Form,
  Input,
  message,
  ConfigProvider,
  theme,
} from "antd";
import PropTypes from "prop-types";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import React, { useState, useEffect } from "react";

export default function AddMedia(props) {
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
          dataServer + "/mediamanagement",
          requestOptions
        );
        const jsonData = await response.json();

        setDataSource(
          jsonData.mediaResults.map((item) => ({
            ...item,
            key: item.mediaID.toString(), // 将 backgroundID 转为字符串，确保 key 为字符串类型
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
      title: "mediaID",
      dataIndex: "mediaID",
      key: "mediaID",
      fixed: "left",
    },
    {
      title: "url",
      dataIndex: "url",
      key: "url",
    },
    {
      title: "caption",
      dataIndex: "caption",
      key: "caption",
    },
    {
      title: "credit",
      dataIndex: "credit",
      key: "credit",
    },
    {
      title: "thumbnail",
      dataIndex: "thumbnail",
      key: "thumbnail",
    },
    {
      title: "alt",
      dataIndex: "alt",
      key: "alt",
    },
    {
      title: "title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "link",
      dataIndex: "link",
      key: "link",
    },
    {
      title: "link_target",
      dataIndex: "link_target",
      key: "link_target",
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
          table: "media",
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
  
  if (error) {
    message.error("Token验证失败,正在返回登录", 5);
    return <p>Error: {error.message}</p>;
  }
  const onFinish = async (values) => {
    console.log("Success:", values);
    try {
      const response = await fetch(dataServer+"/mediamanagement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          mediaID: values.mediaID,
          url: values.url,
          alt: values.alt,
          caption: values.caption,
          credit: values.credit,
          thumbnail: values.thumbnail,
          title: values.title,
          link: values.link,
          link_target: values.link_target,
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        message.error(jsonData.message, 7);

        throw new Error(jsonData.message);
      } else {
        message.success("封面添加成功", 3);
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
          scroll={{
            x: "20vh",
            y: "80vh",
          }}
          dataSource={dataSource}
          columns={columns}
          pagination={{ position: ["topRight"] }}
          style={{ margin: "10px 10px 10px 10px" }}
        />
        <Drawer
          zIndex={2}
          title="添加封面"
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
            name="AddMedia"
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
              label="封面ID"
              name="mediaID"
              rules={[
                {
                  required: true,
                  message: "Please input a mediaID!",
                },
              ]}
            >
              <Input showCount maxLength={255} />
            </Form.Item>
            <Form.Item
              label="URL"
              name="url"
              rules={[
                {
                  required: true,
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
              label="Caption"
              name="caption"
              rules={[
                {
                  required: false,
                  message: "Please input alt",
                },
              ]}
            >
              <TextArea
                showCount
                maxLength={255}
                placeholder="说明文本"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>
            <Form.Item
              label="Credit"
              name="credit"
              rules={[
                {
                  required: false,
                  message: "Please input alt",
                },
              ]}
            >
              <TextArea
                showCount
                maxLength={255}
                placeholder="额外描述或信息"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>
            <Form.Item
              label="Thumbnail"
              name="thumbnail"
              rules={[
                {
                  required: false,
                  message: "Please input URL",
                },
              ]}
            >
              <TextArea
                showCount
                maxLength={255}
                placeholder="小图标"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>
            <Form.Item
              label="Alt"
              name="alt"
              rules={[
                {
                  required: false,
                  message: "Please input URL",
                },
              ]}
            >
              <TextArea
                showCount
                maxLength={255}
                placeholder="替代文本"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>
            <Form.Item
              label="Title"
              name="title"
              rules={[
                {
                  required: false,
                  message: "Please input URL",
                },
              ]}
            >
              <TextArea
                showCount
                maxLength={255}
                placeholder="标题"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>
            <Form.Item
              label="Link"
              name="link"
              rules={[
                {
                  required: false,
                  message: "Please input URL",
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
        {/* </Flex> */}
      </ConfigProvider>
    </>
  );
}

AddMedia.propTypes = {
  placement: PropTypes.string.isRequired,
  dataServer: PropTypes.string.isRequired,
  wh: PropTypes.number.isRequired,
};