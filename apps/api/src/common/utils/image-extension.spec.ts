import { BadRequestException } from '@nestjs/common';
import { imageExtension } from './image-extension';

describe('imageExtension', () => {
  it.each([
    ['photo.jpg', 'jpg'],
    ['photo.JPEG', 'jpeg'],
    ['a.b.png', 'png'],
    ['x.webp', 'webp'],
    ['x.gif', 'gif'],
  ])('%s -> %s', (name, ext) => {
    expect(imageExtension(name)).toBe(ext);
  });

  it.each(['shell.html', 'x.svg', 'x.php', 'payload.js', 'x.png/../evil'])(
    'rejects %s',
    (name) => {
      expect(() => imageExtension(name)).toThrow(BadRequestException);
    },
  );

  it('falls back to jpg when there is no extension', () => {
    expect(imageExtension('photo')).toBe('jpg');
  });
});
