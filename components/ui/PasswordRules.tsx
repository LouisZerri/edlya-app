import { View, Text } from 'react-native';
import { Check, X } from 'lucide-react-native';

interface PasswordRulesProps {
  password: string;
}

const rules = [
  { test: (p: string) => p.length >= 8, label: '8 caractères minimum' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Une majuscule' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Une minuscule' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Un chiffre' },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), label: 'Un caractère spécial (ex: @, !, -)' },
];

export function PasswordRules({ password }: PasswordRulesProps) {
  return (
    <View className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 -mt-2 mb-4">
      {rules.map((rule, index) => {
        const valid = password.length > 0 && rule.test(password);
        return (
          <View key={index} className="flex-row items-center py-1">
            {password.length === 0 ? (
              <View className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 mr-2" />
            ) : valid ? (
              <Check size={16} color="#059669" strokeWidth={3} />
            ) : (
              <X size={16} color="#DC2626" strokeWidth={3} />
            )}
            <Text
              className={`text-xs ml-2 ${
                password.length === 0
                  ? 'text-gray-500 dark:text-gray-400'
                  : valid
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
