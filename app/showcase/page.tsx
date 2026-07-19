import type { Metadata } from "next";
import ShowcaseApp from "@/components/showcase/showcase-app";
import "@/styles/showcase.css";

export const metadata: Metadata = {
  title: "野人先生 AI 设备维修协同中枢 · 方案展示看板",
  description:
    "用于比赛方案展示、评委自主浏览与现场讲解的12章节横版产品看板。全部业务数据均为Demo模拟。",
};

export default function ShowcasePage() {
  return <ShowcaseApp />;
}
