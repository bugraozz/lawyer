import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { BrutalButton } from '../../components/BrutalButton';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalInput } from '../../components/BrutalInput';
import { useCreateCase } from '../../hooks/useCases';
import { createCaseSchema } from '../../schemas';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { CreateCaseRequest } from '../../types';

export default function AddCaseScreen() {
  const router = useRouter();
  const createCaseMutation = useCreateCase();

  const { control, handleSubmit, formState: { errors } } = useForm<CreateCaseRequest>({
    resolver: zodResolver(createCaseSchema.shape.body),
    defaultValues: {
      caseNo: '',
      title: '',
      court: '',
      type: '',
    },
  });

  const onSubmit = (data: CreateCaseRequest) => {
    createCaseMutation.mutate(data, {
      onSuccess: () => {
        router.push('/(tabs)/cases');
      },
      onError: (error) => {
        console.error('Failed to save case:', error);
        alert('Dava kaydedilirken bir hata oluştu.');
      }
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>YENİ DAVA EKLE</Text>
        
        <BrutalCard style={styles.card}>
          <Controller
            control={control}
            name="caseNo"
            render={({ field: { onChange, value } }) => (
              <BrutalInput 
                label="Dava No (Esas)" 
                icon="tag" 
                placeholder="Örn: 2024/123" 
                value={value}
                onChangeText={onChange}
                error={errors.caseNo?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <BrutalInput 
                label="Dava Başlığı" 
                icon="title" 
                placeholder="Örn: Yılmaz vs. Kaya" 
                value={value}
                onChangeText={onChange}
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="court"
            render={({ field: { onChange, value } }) => (
              <BrutalInput 
                label="Mahkeme" 
                icon="account-balance" 
                placeholder="Örn: İstanbul 3. Asliye Ticaret Mahkemesi" 
                value={value}
                onChangeText={onChange}
                error={errors.court?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <BrutalInput 
                label="Dava Türü" 
                icon="category" 
                placeholder="Örn: Ticaret, İş, İcra" 
                value={value}
                onChangeText={onChange}
                error={errors.type?.message}
              />
            )}
          />

          <BrutalButton 
            title={createCaseMutation.isPending ? "KAYDEDİLİYOR..." : "DAVAYI KAYDET"} 
            fullWidth 
            style={styles.btn} 
            onPress={handleSubmit(onSubmit)} 
          />
        </BrutalCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  title: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginBottom: 24,
  },
  card: {
    padding: 24,
  },
  btn: {
    marginTop: 16,
  },
});
