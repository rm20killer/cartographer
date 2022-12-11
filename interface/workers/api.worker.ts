import * as generation from '@cartographer/generation';
import * as pixels from '@cartographer/pixels';
import * as comlink from 'comlink';
import * as defs from '../defs';

type GeneratePreviewParams = {
  image_data: ImageData;
  bounds: defs.Bounds;
  map_scale: defs.MAP_SCALE;
  palette: pixels.defs.BlockPalette;
};
const generatePreview = (params: GeneratePreviewParams) => {
  const preview_scale = 640;

  const [x, y, d] = params.bounds;

  const canvas = new OffscreenCanvas(params.image_data.width, params.image_data.height);
  const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  context.putImageData(params.image_data, 0, 0);

  const image_data = context.getImageData(x, y, d, d);

  const pixel_grid = pixels.conversion.convertImageDataToPixelGrid(image_data);
  const scaled_pixel_grid = pixels.conversion.scaleDownPixelGrid(pixel_grid, params.map_scale, params.map_scale);
  const color_converted = pixels.conversion.convertPixelGridColorsForMC(scaled_pixel_grid, params.palette);
  const scaled_up_pixel_grid = pixels.conversion.scaleUpPixelGrid(color_converted, preview_scale, preview_scale);

  return pixels.conversion.convertPixelGridToImageData(scaled_up_pixel_grid);
};

const generateBlockSpaceFromImageData = (
  image_data: ImageData,
  scale: defs.MAP_SCALE,
  palette: pixels.defs.BlockPalette
) => {
  const pixel_grid = pixels.conversion.convertImageDataToPixelGrid(image_data);
  const scaled_pixel_grid = pixels.conversion.scaleDownPixelGrid(pixel_grid, scale, scale);
  const color_converted = pixels.conversion.convertPixelGridColorsForMC(scaled_pixel_grid, palette);
  const blocks = pixels.conversion.convertPixelGridToMCBlocks(color_converted, palette);

  return generation.block_generation.buildBlockSpace(blocks);
};

export const generateLightmaticaSchema = async (
  image_data: ImageData,
  scale: defs.MAP_SCALE,
  palette: pixels.defs.BlockPalette
) => {
  const block_space = generateBlockSpaceFromImageData(image_data, scale, palette);
  const schema = generation.schema_generation.litematica.generateLitematicaSchema(block_space);
  return await generation.serialization.serializeNBTData(schema);
};

export const generateMapNBT = async (
  image_data: ImageData,
  scale: defs.MAP_SCALE,
  palette: pixels.defs.BlockPalette
) => {
  const block_space = generateBlockSpaceFromImageData(image_data, scale, palette);
  const map = generation.schema_generation.map.asNbtObject(block_space);
  return await generation.serialization.serializeNBTData(map);
};

export const generateMapJSON = async (
  image_data: ImageData,
  scale: defs.MAP_SCALE,
  palette: pixels.defs.BlockPalette
) => {
  const block_space = generateBlockSpaceFromImageData(image_data, scale, palette);
  return Buffer.from(JSON.stringify(block_space));
};

const API = {
  generatePreview: generatePreview,
  generateLitematicaSchema: generateLightmaticaSchema,
  generateMapNBT: generateMapNBT,
  generateMapJSON: generateMapJSON
};

export type API = typeof API;

comlink.expose(API);
