import { Transformations } from '../workers/api.worker';
import * as pixels from '@cartographer/pixels';
import styled from 'styled-components';
import * as hooks from '../hooks';
import * as utils from '../utils';
import * as defs from '../defs';
import * as React from 'react';
import * as async from 'async';

type Props = {
  image_data: ImageData;
  scale: defs.Scale;
  bounds: defs.Bounds;
  color_spectrum: pixels.BlockColorSpectrum;

  transformations: Transformations;

  palette: defs.ColorPalette;

  className?: string;
  style?: React.CSSProperties;
};

const Container = styled.div`
  display: flex;
  padding: 10px;
  align-items: center;
  justify-content: center;
  border: 2px dashed ${(props) => props.theme['dark-green']};
`;

const Canvas = styled.canvas`
  border: 1px solid ${(props) => props.theme.bg2};
`;

const createPreviewQueue = () => {
  return async.cargoQueue(async (tasks: Array<() => Promise<void>>, done) => {
    const last_task = tasks[tasks.length - 1];
    try {
      await last_task();
    } catch (err) {}
    done();
  });
};

export const ImagePreview: React.FC<Props> = (props) => {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const queue = React.useRef(createPreviewQueue());
  const api = hooks.withAPIWorker();

  const [[width, height], setDimensions] = React.useState([0, 0]);

  React.useEffect(() => {
    if (!canvas.current || !api.current) {
      return;
    }

    queue.current.push(async () => {
      const image_data = await api.current!.generatePreview({
        image_data: props.image_data,
        bounds: props.bounds,
        scale: props.scale,
        color_spectrum: props.color_spectrum,
        palette: utils.normalizeColorPalette(props.palette),
        transformations: props.transformations
      });

      canvas.current!.setAttribute('width', image_data.width.toString());
      canvas.current!.setAttribute('height', image_data.height.toString());
      canvas.current!.getContext('2d')!.putImageData(image_data, 0, 0);

      setDimensions([image_data.width, image_data.height]);
    });
  }, [
    props.image_data,
    canvas.current,
    api.current,
    props.bounds,
    props.palette,
    props.scale,
    props.transformations.brightness,
    props.transformations.saturation,
    props.transformations.dither,
    props.color_spectrum
  ]);

  return (
    <Container
      className={props.className}
      style={{
        ...props.style,
        width,
        height
      }}
    >
      <Canvas ref={canvas} />
    </Container>
  );
};

export default ImagePreview;
