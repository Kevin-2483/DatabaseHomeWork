import React, { useEffect, useState } from "react";
import {
  ConfigProvider,
  Popconfirm,
  Select,
  Form,
  Button,
  Flex,
  Input,
  Tree,
  message,
  Modal,
  Table,
  FloatButton,
  theme,
} from "antd";
import PropTypes from "prop-types";
const { Search } = Input;
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

function EventsTree({ dataServer }) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [slide, setSlide] = useState([]);
  const [refreshData, setRefreshData] = useState(true);
  const [selectEvent, setSelectEvent] = useState(null);
  const [token, setToken] = useState(() => {
    // 从Cookie中读取令牌
    const storedToken = document.cookie.replace(
      /(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    return storedToken || "";
  });

  useEffect(() => {
    // 在selectEvent变化时更新selectParentEvent的值
    form.setFieldsValue({ selectParentEvent: selectEvent });
  }, [selectEvent, form]);

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
          dataServer+"/eventtree",
          requestOptions
        );
        const jsonData = await response.json();

        setTreeData(jsonData.forest);
        setSlide(jsonData.slides);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshData]);

  if (error) {
    message.error("Token验证失败,正在返回登录", 5);
    return <p>Error: {error.message}</p>;
  }

  const handleSelect = (selectedKeys, info) => {
    // selectedKeys是被选中节点的key数组
    // info.node是被选中节点的详细信息，包括title、key、data等属性

    // 示例输出
    if (info.selected) {
      setSelected(info.node);
      setSelectEvent(info.node.key);
    } else {
      setSelected(null);
      setSelectEvent(null);
    }
  };
  const rightClick = ({ event, node }) => {
    console.log("Right-click event:", event);
    console.log("Clicked node:", node);
    const dataSource = [
      {
        key: node.key,
        EventID: node.title,
        ParentEventID: node.ParentEvent,
      },
    ];
    const columns = [
      {
        title: "事件ID",
        dataIndex: "EventID",
        key: "EventID",
      },
      {
        title: "日程ID",
        dataIndex: "key",
        key: "key",
      },
      {
        title: "父日程ID",
        dataIndex: "ParentEventID",
        key: "ParentEventID",
      },
    ];

    Modal.info({
      title: node.title,
      content: (
        <Table
          dataSource={dataSource}
          pagination={{ position: ["none", "none"] }}
          columns={columns}
        />
      ),

      onOk() {},
    });
  };

  const onFinish = async (values) => {
    console.log("Success:", values);
    try {
      const response = await fetch(
        dataServer+"/activitiesmanagement",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
            // 如果有其他头部信息，也可以在这里添加
          },
          body: JSON.stringify({
            selectEvent: values.selectEvent,
            selectParentEvent: values.selectParentEvent,
            scheduleID: values.scheduleID,
          }), // 将数据转换为JSON格式
        }
      );
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        message.error(jsonData.message, 7);
        throw new Error(jsonData.message);
      } else {
        message.success("添加成功", 3);
        setRefreshData(!refreshData);
        setOpen(!open);
      }
    } catch (error) {
      console.error("Error during POST request:", error);
    }
  };
  const onFinishFailed = (errorInfo) => {
    message.error(errorInfo);
    console.log("Failed:", errorInfo);
  };

  const onDelete = async () => {
    console.log("Success:", selectEvent);
    try {
      const response = await fetch(dataServer+"/deleteRecord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          table: "events",
          id: selectEvent,
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
        setSelected(null);
        setSelectEvent(null);
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
        > */}
        <Tree
          treeData={treeData}
          showLine
          onSelect={handleSelect}
          onRightClick={rightClick}
          style={{ margin: "10px 10px 10px 10px", width: "96vw",
            height: "61vh",}}
        />
        <FloatButton.Group
          shape="square"
          style={{
            right: 40,
            bottom: 170,
          }}
        >
          <FloatButton
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => setOpen(true)}
            tooltip={
              selected == null
                ? "添加根日程"
                : "添加" + selected.title + "的子日程"
            }
          />
          <Popconfirm
            title="删除?"
            description="你确定删除此日程吗"
            okText="是"
            cancelText="取消"
            onConfirm={onDelete}
            placement="leftBottom"
          >
            <FloatButton
              icon={<DeleteOutlined />}
              type={
                selected == null || selected.children.length != 0
                  ? "default"
                  : "primary"
              }
              disabled={
                selected == null || selected.children.length != 0 ? true : false
              }
              tooltip={
                selected == null || selected.children.length != 0
                  ? "选择一个无子日程的项目来删除"
                  : "删除" + selected.title
              }
            />
          </Popconfirm>
        </FloatButton.Group>
        {/* </Flex> */}
        <Modal
          title={"添加事件"}
          open={open}
          closable={false}
          footer={[
            <Button key="cancel" onClick={() => setOpen(false)}>
              取消
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={() => form.submit()}
              loading={loading}
            >
              提交
            </Button>,
          ]}
        >
          <Form
            form={form}
            name="AddAc"
            autoComplete="off"
            style={{
              //maxWidth: 600,
              width: "85%",
              margin: "10px 10px 10px 10px",
            }}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            initialValues={{ selectParentEvent: selectEvent }} // 使用 initialValues 设置初始值
          >
            <Form.Item
              label="Schedule ID"
              name="scheduleID"
              rules={[
                {
                  required: true,
                  message: "Please input a New scheduleID!",
                },
              ]}
            >
              <Input showCount maxLength={255} />
            </Form.Item>
            <Form.Item
              label="ParentEvent"
              name="selectParentEvent"
              rules={[
                {
                  required: false,
                  message: "Please input a ParentEvent!",
                },
              ]}
            >
              <Input showCount maxLength={255} readOnly />
            </Form.Item>
            <Form.Item
              label="Select Event"
              name="selectEvent"
              rules={[
                {
                  required: true,
                  message: "Please select a eventID!",
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
                options={slide}
              />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </>
  );
}

export default EventsTree;
EventsTree.propTypes = {
  dataServer: PropTypes.string.isRequired,
};
