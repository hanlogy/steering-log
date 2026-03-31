import { getDateParts } from '@/helpers/getTimeParts';

function mockDate(parts: {
  year: number;
  month: number;
  date: number;
  hours: number;
  minutes: number;
  seconds: number;
}): void {
  jest.spyOn(global, 'Date').mockImplementation(
    () =>
      ({
        getFullYear: () => parts.year,
        getMonth: () => parts.month,
        getDate: () => parts.date,
        getHours: () => parts.hours,
        getMinutes: () => parts.minutes,
        getSeconds: () => parts.seconds,
      }) as unknown as Date,
  );
}

describe('getDateParts', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('pads single-digit month, day, hours, minutes, seconds', () => {
    mockDate({
      year: 2026,
      month: 2,
      date: 7,
      hours: 9,
      minutes: 5,
      seconds: 3,
    });

    expect(getDateParts('any')).toStrictEqual({
      year: '2026',
      month: '03',
      day: '07',
      hours: '09',
      minutes: '05',
      seconds: '03',
    });
  });

  test('does not pad two-digit values', () => {
    mockDate({
      year: 2026,
      month: 11,
      date: 31,
      hours: 23,
      minutes: 59,
      seconds: 59,
    });

    expect(getDateParts('any')).toStrictEqual({
      year: '2026',
      month: '12',
      day: '31',
      hours: '23',
      minutes: '59',
      seconds: '59',
    });
  });
});
