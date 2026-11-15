import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DeleteImageFileDto } from './delete-image-file.dto';

async function isValid(filePath: unknown) {
  const errors = await validate(
    plainToInstance(DeleteImageFileDto, { filePath }),
  );
  return errors.length === 0;
}

describe('DeleteImageFileDto.filePath', () => {
  it.each([
    'home/hero_images/0b9a7c3e-1f2d-4e5a-9b8c-7d6e5f4a3b2c.jpg',
    'about/story-image/0b9a7c3e-1f2d-4e5a-9b8c-7d6e5f4a3b2c.WEBP',
    // uploaded before the extension whitelist: must still be deletable
    'home/hero_images/0b9a7c3e-1f2d-4e5a-9b8c-7d6e5f4a3b2c.heic',
  ])('accepts an upload-shaped path %s', async (p) => {
    expect(await isValid(p)).toBe(true);
  });

  it.each([
    '../other-bucket/x.jpg',
    'home/../../x.jpg',
    'home/hero_images/abc.jpg',
    '0b9a7c3e-1f2d-4e5a-9b8c-7d6e5f4a3b2c.jpg',
  ])('rejects %s', async (p) => {
    expect(await isValid(p)).toBe(false);
  });
});
