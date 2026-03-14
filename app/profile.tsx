import { useUser } from '@clerk/clerk-expo';
import Feather from '@expo/vector-icons/Feather';
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

export default function ProfileScreen() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const insets = useSafeAreaInsets();

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
            <YStack flex={1} backgroundColor="#161616" justifyContent="center" alignItems="center">
                <ActivityIndicator size="large" color="#FFFFFF" />
            </YStack>
        );
    }

    return (
        <YStack flex={1} backgroundColor="#161616">
            <StatusBar style="light" />

            {/* Header */}
            <XStack
                alignItems="center"
                justifyContent="space-between"
                paddingHorizontal={20}
                paddingBottom={20}
                paddingTop={insets.top + 10}
                backgroundColor="#161616"
                borderBottomWidth={1}
                borderBottomColor="rgba(255,255,255,0.05)"
            >
                <YStack
                    width={40} height={40}
                    alignItems="center" justifyContent="center"
                    borderRadius={20}
                    backgroundColor="rgba(255,255,255,0.05)"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color="#FFFFFF" />
                </YStack>
                <Text fontSize={18} fontWeight="600" color="#FFFFFF">
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
                    <YStack alignItems="center" marginBottom={32}>
                        <YStack
                            width={80} height={80} borderRadius={40}
                            backgroundColor="#FFFFFF"
                            alignItems="center" justifyContent="center"
                            marginBottom={16}
                        >
                            <Feather name="user" size={40} color="#161616" />
                        </YStack>
                        <Text fontSize={14} color="rgba(255,255,255,0.5)">
                            {user?.primaryEmailAddress?.emailAddress}
                        </Text>
                    </YStack>

                    {/* Form */}
                    <YStack marginBottom={32}>
                        <YStack marginBottom={20}>
                            <Text fontSize={14} color="rgba(255,255,255,0.7)" marginBottom={8}>
                                First Name
                            </Text>
                            <Input
                                backgroundColor="rgba(255,255,255,0.05)"
                                borderRadius={12}
                                padding={16}
                                color="#FFFFFF"
                                fontSize={16}
                                borderWidth={1}
                                borderColor="rgba(255,255,255,0.1)"
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First Name"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                            />
                        </YStack>

                        <YStack marginBottom={20}>
                            <Text fontSize={14} color="rgba(255,255,255,0.7)" marginBottom={8}>
                                Last Name
                            </Text>
                            <Input
                                backgroundColor="rgba(255,255,255,0.05)"
                                borderRadius={12}
                                padding={16}
                                color="#FFFFFF"
                                fontSize={16}
                                borderWidth={1}
                                borderColor="rgba(255,255,255,0.1)"
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last Name"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                            />
                        </YStack>
                    </YStack>

                    {/* Save Button */}
                    <Button
                        backgroundColor="#FFFFFF"
                        borderRadius={12}
                        height={50}
                        onPress={handleSave}
                        disabled={isSaving}
                        opacity={isSaving ? 0.7 : 1}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#161616" />
                        ) : (
                            <Text fontSize={16} fontWeight="600" color="#161616">
                                Save Changes
                            </Text>
                        )}
                    </Button>

                </ScrollView>
            </KeyboardAvoidingView>
        </YStack>
    );
}
