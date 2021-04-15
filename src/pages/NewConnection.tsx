import React, { useState } from "react";
import { useHistory } from "react-router";
import { useDispatch } from "react-redux";

import { Button, Flex, Input, Textarea, Text } from "@chakra-ui/react";
import { toast } from "react-toastify";

import { addFile } from "../store/modules/wgConfig/action";

import Content from "../components/Content";

interface ConfFile {
  name: string;
  path: string;
  data: string;
}

export default function NewConnection() {
  const history = useHistory();
  const dispatch = useDispatch();
  const [file, setFile] = useState<ConfFile | undefined>();

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files && event.currentTarget.files.length > 0) {
      const currentFile = event.currentTarget.files[0];

      try {
        const reader = new FileReader();
        reader.readAsText(currentFile, "utf-8");
        reader.onload = function (evt: ProgressEvent<FileReader>) {
          if (!evt.target) return;
          setFile({ name: currentFile.name, path: currentFile.path, data: evt.target.result as string });
        }

        reader.onerror = function () {
          toast(`Could not read file ${currentFile.name}`, { type: "error" });
        }
      } catch (e) {
        toast(e.message, { type: "error" });
      }
    }
  }

  function handleCancel() {
    history.push("/");
  }

  async function handleSave() {
    if (!file) {
      toast("No file selected!", { type: "error" });
      return;
    }

    try {
      dispatch(addFile(file.name, file.data));
      history.push(`/connection/${file.name.split(".")[0]}`);
    } catch (e) {
      toast(e.message, { type: "error" });
    }
  }

  return (
    <Content>
      <Flex
        bg="gray.200"
        borderRadius="4"
        color="whiteAlpha.700"
        direction="column"
        p="4"
        w="50%"
        maxH="300px"
        mx="auto"
        mt="8"
      >
        <Flex justify="space-between" w="100%">
          <Text color="whiteAlpha.800" fontSize="lg" fontWeight="bold">
            New Connection
          </Text>
          <Button size="xs">Import</Button>
          <input type="file" accept=".conf" onChange={handleImport}></input>
        </Flex>
        <Flex align="center" mt="4" w="100%">
          <Text>Name:</Text>
          <Input
            bg="gray.300"
            borderColor="transparent"
            size="xs"
            w="50%"
            ml="2"
          />
        </Flex>
        <Flex direction="column" mt="4" w="100%" h="100%">
          <Text>Interface:</Text>
          <Textarea
            bg="gray.300"
            borderColor="transparent"
            size="xs"
            resize="none"
            mt="2"
            w="100%"
            h="100%"
            value={file?.data}
          />
        </Flex>
        <Flex justify="flex-end" mt="4">
          <Button size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            color="whiteAlpha.800"
            colorScheme="orange"
            size="sm"
            ml="4"
            disabled={!!file === false}
            onClick={handleSave}
          >
            Save
          </Button>
        </Flex>
      </Flex>
    </Content>
  );
}
