import { Composition } from "remotion";
import { AgentScopeDemo } from "./AgentScopeDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AgentScopeDemo"
        component={AgentScopeDemo}
        durationInFrames={3600} // 120s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
