import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { useSelector, useDispatch } from "react-redux";

import * as fs from "fs";
import * as path from "path";
import { WgConfig } from "wireguard-tools";
import { Button, Flex, Text, Textarea } from "@chakra-ui/react";
import { toast } from "react-toastify";

import { getCurrentConnectionName } from "../utils";
import { deleteFile, updateStatus } from "../store/modules/wgConfig/action";
import { AppState, StoreState, WgConfigFile, WgConfigState } from "../types/store";

import DialogButton from "../components/DialogButton";
import Content from "../components/Content";

interface ConnectionParam {
  name: string;
}

export default function ConnectionInfo() {
  const history = useHistory();
  const dispatch = useDispatch();
  const [file, setFile] = useState<WgConfig>();
  const [wgConfigFile, setWgConfigFile] = useState<WgConfigFile>();
  const { name } = useParams<ConnectionParam>();
  const { files } = useSelector<StoreState, WgConfigState>(
    (state) => state.wgConfig
  );
  const { userDataPath } = useSelector<StoreState, AppState>(
    (state) => state.app
  );

  useEffect(() => {
    const filePath = path.join(
      userDataPath,
      "configurations",
      `${name}.conf`,
    );

    const data = fs.readFileSync(filePath, "utf-8");
    const config = new WgConfig({});
    config.parse(data);

    setFile(config);
    setWgConfigFile(files.find(f => f.name === name));
  }, [name]);

  useEffect(() => {
    setWgConfigFile(files.find(f => f.name === name));
  }, [files]);

  async function toggleActive() {
    if (!file || !wgConfigFile) {
      toast("Could not load config file", { type: "error" });
      return;
    }

    try {
      let curConName = await getCurrentConnectionName();
      if (curConName && curConName !== wgConfigFile.name) {
        toast("Another tunnel is already running, deactivate it first.", { type: "error" });
        return;
      }

      const config = new WgConfig({ filePath: wgConfigFile.path })
      await config.parseFile();

      if (wgConfigFile.active) {
        await config.down();
        toast(`Deactivated ${wgConfigFile.name}`, { type: "success" });
      } else {
        await config.up();
        toast(`Activated ${wgConfigFile.name}`, { type: "success" });
      }

      curConName = await getCurrentConnectionName();
      dispatch(updateStatus(curConName));
    } catch (e) {
      toast(e.message, { type: "error" });
    }
  }

  async function handleDelete() {
    if (!wgConfigFile) {
      toast(`Could not find config for ${name}`, { type: "error" });
      return;
    }

    if (wgConfigFile.active) {
      toast("Stop the tunnel before deleting", { type: "error" });
      return;
    }

    try {
      dispatch(deleteFile(wgConfigFile, userDataPath));
      history.push("/");
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
        w="575px"
        h="625px"
        mx="auto"
        mt="8"
      >
        <Flex justify="space-between" w="100%">
          <Text color="whiteAlpha.800" fontSize="lg" fontWeight="bold">
            Connection Info
          </Text>
        </Flex>
        <Flex align="center" mt="4" w="100%">
          <Text fontWeight="medium">Name:&nbsp;</Text>
          {file && <Text>{name}</Text>}
        </Flex>
        <Flex align="center" mt="2" w="100%">
          <Text fontWeight="medium">Addresses:&nbsp;</Text>
          {file && <Text>{file.wgInterface.address?.join(", ")}</Text>}
        </Flex>
        <Flex align="center" mt="2" w="100%">
          <Text fontWeight="medium">DNS:&nbsp;</Text>
          {file && <Text>{file.wgInterface.dns?.join(", ")}</Text>}
        </Flex>
        {file?.peers?.map((peer) => {
          return (
            <div key={peer.publicKey}>
              <Flex align="center" mt="2" w="100%">
                <Text fontWeight="medium">Allowed IPs:&nbsp;</Text>
                <Text>{peer.allowedIps?.join(", ")}</Text>
              </Flex>
              <Flex align="center" mt="2" w="100%">
                <Text fontWeight="medium">Endpoint:&nbsp;</Text>
                <Text>{peer.endpoint}</Text>
              </Flex>
              <Flex align="center" mt="2" w="100%">
                <Text fontWeight="medium">Public key:&nbsp;</Text>
                <Text>{peer.publicKey}</Text>
              </Flex>
            </div>
          );
        })}
        <Flex direction="column" mt="4" w="100%" h="100%">
          <Text fontWeight="medium">Interface:&nbsp;</Text>
          <Textarea
            bg="gray.300"
            borderColor="transparent"
            size="xs"
            resize="none"
            mt="2"
            w="100%"
            h="100%"
            value={file?.toString()}
            readOnly
          />
        </Flex>
        <Flex justify="flex-end" mt="auto">
          <DialogButton
            header="Are you sure?"
            body="You cannot recover this file after deleting."
            onConfirm={handleDelete}
            launchButtonText="Delete"
          />
          <Button
            color="whiteAlpha.800"
            colorScheme="orange"
            size="sm"
            ml="4"
            onClick={toggleActive}
          >
            {(wgConfigFile && wgConfigFile.active) ? "Deactivate" : "Activate"}
          </Button>
        </Flex>
      </Flex>
    </Content>
  );
}
