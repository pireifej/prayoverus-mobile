import { parsePrayerRequestLink } from '../../utils/prayerLinks';

describe('prayer and testimonial destinations', () => {
  test.each([
    'https://prayoverus.com/index.html?requestId=501',
    'prayoverus://open?request_id=501&open=testimony',
    'prayoverus://request/501',
    'https://prayoverus.com/prayer/501?section=testimony',
    'prayoverus://open?link=https%3A%2F%2Fprayoverus.com%2Findex.html%3FrequestId%3D501',
  ])('retains the request ID in %s', link => {
    expect(parsePrayerRequestLink(link)).toBe(501);
  });
  test.each(['prayoverus://', null, 'prayoverus://open?requestId=0', 'https://prayoverus.com/?requestId=501abc'])(
    'does not invent a destination for %s', link => {
      expect(parsePrayerRequestLink(link)).toBeNull();
    },
  );
});
