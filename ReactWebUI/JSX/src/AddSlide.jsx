import React, { useState, useEffect } from "react";
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
  Select,
  Switch,
  ConfigProvider,
  theme,
} from "antd";
import PropTypes from "prop-types";
import { DatePicker } from "antd";
const { TextArea } = Input;
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

export default function AddSlide(props) {
  const { placement, wh, dataServer } = props;
  const [form] = Form.useForm();
  const [bgData, setBgData] = useState([]);
  const [mediaData, setMediaData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [refreshData, setRefreshData] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  const [token, setToken] = useState(() => {
    // 从Cookie中读取令牌
    const storedToken = document.cookie.replace(
      /(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    return storedToken || "";
  });
  const [open, setOpen] = useState(false);
  const { RangePicker } = DatePicker;
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
          dataServer + "/eventmanagement",
          requestOptions
        );
        const jsonData = await response.json();

        setMediaData(jsonData.mediaData);
        setBgData(jsonData.backgroundData);
        setEventData(jsonData.event_details);
        setDataSource(
          jsonData.slidesResults.map((item) => ({
            ...item,
            key: item.Slides_unique_id.toString(), // 将 backgroundID 转为字符串，确保 key 为字符串类型
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
      title: "Slides_unique_id",
      dataIndex: "Slides_unique_id",
      key: "Slides_unique_id",
      fixed: "left",
    },
    {
      title: "start_date",
      dataIndex: "start_date",
      key: "start_date",
    },
    {
      title: "end_date",
      dataIndex: "end_date",
      key: "end_date",
    },
    {
      title: "textID",
      dataIndex: "textID",
      key: "textID",
    },
    {
      title: "mediaID",
      dataIndex: "mediaID",
      key: "mediaID",
    },
    {
      title: "group",
      dataIndex: "group",
      key: "group",
    },
    {
      title: "display_date",
      dataIndex: "display_date",
      key: "display_date",
    },
    {
      title: "autolink",
      dataIndex: "autolink",
      key: "autolink",
    },

    {
      title: "backgroundID",
      dataIndex: "backgroundID",
      key: "backgroundID",
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
          table: "slides",
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
    try {
      const response = await fetch(dataServer+"/eventmanagement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          start_time: values.start_time[0].$d,
          start_date_display_date: values.start_date_display_date,
          end_time:
            values.start_time && values.start_time[1]
              ? values.start_time[1].$d
              : null,
          end_date_display_date: values.end_date_display_date,
          headline: values.headline,
          text: values.text,
          mediaID: values.mediaID,
          group: values.group,
          event_display_date: values.event_display_date,
          autoLink: values.autoLink,
          backgroundID: values.backgroundID,
          eventID: values.eventID,
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      if (!jsonData.success) {
        message.error(jsonData.message, 7);

        throw new Error(jsonData.message);
      } else {
        message.success("添加成功", 3);
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
        <Drawer
          title="合成事件"
          width={wh + "vw"}
          height={wh + "vh"}
          placement={placement}
          onClose={onClose}
          open={open}
          zIndex={2}
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
            name="AddSlide"
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
              name="eventID"
              rules={[
                {
                  required: true,
                  message: "Please input a eventID!",
                },
              ]}
            >
              <Select
                showSearch
                placeholder="Search to Select"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "").includes(input)
                }
                filterSort={(optionA, optionB) =>
                  (optionA?.label ?? "")
                    .toLowerCase()
                    .localeCompare((optionB?.label ?? "").toLowerCase())
                }
                options={eventData}
              />
            </Form.Item>
            <Form.Item
              label="事件封面ID"
              name="mediaID"
              rules={[
                {
                  required: false,
                  message: "Please input URL",
                },
              ]}
            >
              <Select
                allowClear
                showSearch
                placeholder="Search to Select"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "").includes(input)
                }
                filterSort={(optionA, optionB) =>
                  (optionA?.label ?? "")
                    .toLowerCase()
                    .localeCompare((optionB?.label ?? "").toLowerCase())
                }
                options={mediaData}
              />
            </Form.Item>
            <Form.Item
              label="事件背景ID"
              name="backgroundID"
              rules={[
                {
                  required: false,
                  message: "Please input backgroundID",
                },
              ]}
            >
              <Select
                allowClear
                showSearch
                placeholder="Search to Select"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "").includes(input)
                }
                filterSort={(optionA, optionB) =>
                  (optionA?.label ?? "")
                    .toLowerCase()
                    .localeCompare((optionB?.label ?? "").toLowerCase())
                }
                options={bgData}
              />
            </Form.Item>
            <Form.Item
              label="事件标题"
              name="headline"
              rules={[
                {
                  required: false,
                  message: "Please input headline",
                },
              ]}
            >
              <TextArea
                showCount
                maxLength={255}
                placeholder="Please input headline"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>
            <Form.Item
              label="事件描述"
              name="text"
              rules={[
                {
                  required: false,
                  message: "Please input text",
                },
              ]}
            >
              <TextArea
                showCount
                maxLength={255}
                placeholder="Please input text"
                autoSize={{
                  minRows: 2,
                  maxRows: 6,
                }}
              />
            </Form.Item>
            <Form.Item
              label="事件所属群组"
              name="group"
              rules={[
                {
                  required: false,
                  message: "Please input URL",
                },
              ]}
            >
              <Input showCount maxLength={255} />
            </Form.Item>
            <Form.Item
              label="事件别名"
              name="event_display_date"
              rules={[
                {
                  required: false,
                  message: "Please input URL",
                },
              ]}
            >
              <Input showCount maxLength={255} />
            </Form.Item>

            <Form.Item
              label="自动高亮超链接选项"
              name="autoLink"
              rules={[
                {
                  required: false,
                  message: "Please input URL",
                },
              ]}
            >
              <Switch checkedChildren="1" unCheckedChildren="0" />
            </Form.Item>
            <Form.Item
              label="事件时间"
              name="start_time"
              rules={[
                {
                  required: true,
                  message: "Please input URL",
                },
              ]}
            >
              <RangePicker showTime allowEmpty={[false, true]} />
            </Form.Item>
            <Form.Item
              label="开始时间名称"
              name="start_date_display_date"
              rules={[
                {
                  required: false,
                  message: "Please input URL",
                },
              ]}
            >
              <Input showCount maxLength={255} />
            </Form.Item>
            <Form.Item
              label="结束时间名称"
              name="end_date_display_date"
              rules={[
                {
                  required: false,
                  message: "Please input URL",
                },
              ]}
            >
              <Input showCount maxLength={255} />
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
        <Table
          zIndex={1}
          dataSource={dataSource}
          columns={columns}
          scroll={{
            x: 2000,
          }}
          pagination={{ position: ["topRight"] }}
          style={{ margin: "10px 10px 10px 10px" }}
        />
        {/* </Flex> */}
      </ConfigProvider>
    </>
  );
}
AddSlide.propTypes = {
  placement: PropTypes.string.isRequired,
  wh: PropTypes.number.isRequired,
  dataServer: PropTypes.string.isRequired,
};