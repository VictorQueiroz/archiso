import {IPreset} from "../preset/Preset";

export interface IPluginContext {
  preset: IPreset;
  /**
   * ISO root directory
   */
  rootDir: string;
  /**
   * airootfs root directory
   */
  airootfsDir: string;
}

export interface IPlugin {
  run(ctx: IPluginContext): Promise<void>;
}
