import Feather from '@expo/vector-icons/Feather';
import { PropsWithChildren, useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <YStack>
      <XStack
        alignItems="center"
        gap={6}
        pressStyle={{ opacity: 0.7 }}
        onPress={() => setIsOpen((value) => !value)}
      >
        <Feather
          name="chevron-right"
          size={18}
          color="$color"
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />
        <Text fontWeight="600" color="$color">
          {title}
        </Text>
      </XStack>
      {isOpen && (
        <YStack marginTop={6} marginLeft={24}>
          {children}
        </YStack>
      )}
    </YStack>
  );
}
