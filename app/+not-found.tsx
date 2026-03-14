import { Link, Stack } from 'expo-router';
import { H2, Paragraph, YStack } from 'tamagui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <YStack flex={1} alignItems="center" justifyContent="center" padding={20} backgroundColor="$background">
        <H2 color="$color">This screen does not exist.</H2>
        <Link href="/" style={{ marginTop: 15, paddingVertical: 15 }}>
          <Paragraph color="$blue10">Go to home screen!</Paragraph>
        </Link>
      </YStack>
    </>
  );
}
