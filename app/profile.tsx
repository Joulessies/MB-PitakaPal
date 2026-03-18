import { useUser } from '@clerk/clerk-expo';
import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Text, XStack, YStack } from 'tamagui';
import { useAppTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
 
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!isLoaded || !user) return;

        setIsSaving(true);
        try {
            await user.update({
                firstName,
                lastName,
            });
            Alert.alert('Success', 'Profile updated successfully.');
        } catch (err: any) {
            Alert.alert('Error', err.errors ? err.errors[0].message : 'Could not update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isLoaded) {
        return (
            <YStack flex={1} backgroundColor={colors.background} justifyContent="center" alignItems="center">
                <ActivityIndicator size="large" color={colors.text} />
            </YStack>
        );
    }

    return (
        <YStack flex={1} backgroundColor={colors.background}>
            <StatusBar style="light" />
 
            {/* Header */}
            <XStack
                alignItems="center"
                justifyContent="space-between"
                paddingHorizontal={20}
                paddingBottom={16}
                paddingTop={insets.top + 10}
                backgroundColor={colors.background}
                borderBottomWidth={1}
                borderBottomColor={colors.border}
            >
                <YStack
                    width={40} height={40}
                    alignItems="center" justifyContent="center"
                    borderRadius={12}
                    backgroundColor={colors.section}
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color={colors.text} />
                </YStack>
                <Text fontSize={18} fontWeight="700" color={colors.text}>
                    Edit Profile
                </Text>
                <YStack width={40} />
            </XStack>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ padding: 24 }}>

                    {/* Avatar Placeholder */}
                    <YStack alignItems="center" marginBottom={40}>
                        <YStack
                            width={100} height={100} borderRadius={50}
                            backgroundColor={colors.section}
                            alignItems="center" justifyContent="center"
                            marginBottom={16}
                            borderWidth={2}
                            borderColor={colors.border}
                            position="relative"
                            overflow="hidden"
                        >
                            {user?.imageUrl ? (
                                <Image source={{ uri: user.imageUrl }} style={{ width: 100, height: 100 }} />
                            ) : (
                                <Feather name="user" size={48} color={colors.text} />
                            )}
                            <YStack 
                                position="absolute" bottom={0} right={0} 
                                backgroundColor="#007DFE" width={32} height={32} 
                                borderRadius={16} alignItems="center" justifyContent="center"
                                borderWidth={3} borderColor={colors.background}
                                zIndex={10}
                            >
                                <Feather name="camera" size={14} color="#FFF" />
                            </YStack>
                        </YStack>
                        <Text fontSize={15} fontWeight="600" color={colors.text}>
                            {user?.fullName || 'User'}
                        </Text>
                        <Text fontSize={13} color={colors.textSecondary} marginTop={4}>
                            {user?.primaryEmailAddress?.emailAddress}
                        </Text>
                    </YStack>

                    {/* Form */}
                    <YStack gap={24} marginBottom={40}>
                        <YStack>
                            <Text fontSize={13} fontWeight="600" color={colors.textSecondary} marginBottom={8} marginLeft={4}>
                                First Name
                            </Text>
                            <Input
                                backgroundColor={colors.section as any}
                                borderRadius={16}
                                height={56}
                                paddingHorizontal={16}
                                color={colors.text as any}
                                fontSize={16}
                                borderWidth={1}
                                borderColor={colors.border as any}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Enter first name"
                                placeholderTextColor={colors.textSecondary as any}
                            />
                        </YStack>
 
                        <YStack>
                            <Text fontSize={13} fontWeight="600" color={colors.textSecondary} marginBottom={8} marginLeft={4}>
                                Last Name
                            </Text>
                            <Input
                                backgroundColor={colors.section as any}
                                borderRadius={16}
                                height={56}
                                paddingHorizontal={16}
                                color={colors.text as any}
                                fontSize={16}
                                borderWidth={1}
                                borderColor={colors.border as any}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Enter last name"
                                placeholderTextColor={colors.textSecondary as any}
                            />
                        </YStack>
                    </YStack>

                    {/* Save Button */}
                    <Button
                        backgroundColor="#007DFE"
                        borderRadius={16}
                        height={56}
                        onPress={handleSave}
                        disabled={isSaving}
                        pressStyle={{ opacity: 0.8, scale: 0.98 }}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text fontSize={16} fontWeight="700" color="#FFFFFF">
                                Save Changes
                            </Text>
                        )}
                    </Button>

                </ScrollView>
            </KeyboardAvoidingView>
        </YStack>
    );
}
