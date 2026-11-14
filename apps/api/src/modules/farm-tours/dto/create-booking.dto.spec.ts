import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBookingDto } from './create-booking.dto';

const base = {
  tourId: 'tour-123',
  contactName: '王小明',
  contactPhone: '0912345678',
};

async function errorsFor(participants: unknown) {
  const dto = plainToInstance(CreateBookingDto, { ...base, participants });
  const errors = await validate(dto);
  return errors.filter((e) => e.property === 'participants');
}

describe('CreateBookingDto.participants', () => {
  it('accepts a whole number of people', async () => {
    expect(await errorsFor(2)).toHaveLength(0);
  });

  it.each([1.5, 0, -1, 1000])('rejects %p', async (value) => {
    expect(await errorsFor(value)).not.toHaveLength(0);
  });
});
