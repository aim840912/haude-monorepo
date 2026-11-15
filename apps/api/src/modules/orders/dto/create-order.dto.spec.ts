import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrderItemDto } from './create-order.dto';

async function errorsFor(quantity: unknown) {
  const dto = plainToInstance(OrderItemDto, {
    productId: '7f3c1e2a-4b5d-4e6f-8a9b-0c1d2e3f4a5b',
    quantity,
  });
  const errors = await validate(dto);
  return errors.filter((e) => e.property === 'quantity');
}

describe('OrderItemDto.quantity', () => {
  it.each([1, 99])('accepts %p', async (value) => {
    expect(await errorsFor(value)).toHaveLength(0);
  });

  // Same bounds as the cart DTO: an order line comes from the cart.
  it.each([1.5, 0, -1, 100])('rejects %p', async (value) => {
    expect(await errorsFor(value)).not.toHaveLength(0);
  });
});
