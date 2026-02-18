import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity, Animated } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import Constants from 'expo-constants';
import { COLORS } from '../../utils/constants';

interface InputWithVoiceProps extends Omit<TextInputProps, 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  appendMode?: boolean;
}

// Vérifie si on est dans Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// NOTE: La dictée vocale nécessite un build natif (EAS Build)
// Dans Expo Go, le bouton micro n'apparaîtra pas
// Pour activer: faire un build avec `eas build`

export function InputWithVoice({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  multiline = true,
  numberOfLines = 3,
  appendMode = true,
  ...props
}: InputWithVoiceProps) {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [speechModule, setSpeechModule] = useState<any>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const subscriptionsRef = useRef<any[]>([]);

  // Charger le module uniquement si pas Expo Go
  useEffect(() => {
    if (isExpoGo) {
      setVoiceAvailable(false);
      return;
    }

    // Dans un build natif, charger le module après un délai
    const timer = setTimeout(async () => {
      try {
        // Dynamic import pour éviter le bundling dans Expo Go
        const mod = await import('expo-speech-recognition');
        if (mod?.ExpoSpeechRecognitionModule) {
          setSpeechModule(mod);
          setVoiceAvailable(true);
        }
      } catch (e) {
        setVoiceAvailable(false);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      subscriptionsRef.current.forEach(sub => sub?.remove?.());
    };
  }, []);

  // Animation du bouton
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const handleVoicePress = useCallback(async () => {
    if (!speechModule) return;

    if (isListening) {
      try {
        speechModule.ExpoSpeechRecognitionModule.stop();
        setIsListening(false);
      } catch {}
      return;
    }

    const { ExpoSpeechRecognitionModule, addSpeechRecognitionListener } = speechModule;

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        setVoiceError('Permission micro refusée');
        return;
      }

      setVoiceError(null);
      setIsListening(true);

      subscriptionsRef.current.forEach(sub => sub?.remove?.());
      subscriptionsRef.current = [];

      const resultSub = addSpeechRecognitionListener('result', (event: { results?: Array<{ transcript?: string }>; isFinal?: boolean }) => {
        const text = event.results?.[0]?.transcript || '';
        if (event.isFinal && text) {
          if (appendMode && value) {
            const separator = value.endsWith(' ') || value.endsWith('\n') ? '' : ' ';
            onChangeText(value + separator + text);
          } else {
            onChangeText(text);
          }
          setIsListening(false);
        }
      });
      subscriptionsRef.current.push(resultSub);

      const errorSub = addSpeechRecognitionListener('error', () => {
        setIsListening(false);
        setVoiceError('Erreur de reconnaissance');
      });
      subscriptionsRef.current.push(errorSub);

      const endSub = addSpeechRecognitionListener('end', () => {
        setIsListening(false);
      });
      subscriptionsRef.current.push(endSub);

      ExpoSpeechRecognitionModule.start({
        lang: 'fr-FR',
        interimResults: true,
        continuous: false,
      });
    } catch {
      setVoiceError('Erreur démarrage');
      setIsListening(false);
    }
  }, [speechModule, isListening, value, appendMode, onChangeText]);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {voiceAvailable && (
          <Animated.View style={{ transform: [{ scale: isListening ? pulseAnim : 1 }] }}>
            <TouchableOpacity
              onPress={handleVoicePress}
              style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
              activeOpacity={0.7}
            >
              {isListening ? (
                <MicOff size={18} color="white" />
              ) : (
                <Mic size={18} color={COLORS.primary[600]} />
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={isListening ? 'Parlez maintenant...' : placeholder}
        placeholderTextColor={isListening ? COLORS.primary[500] : COLORS.gray[400]}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
          isListening && styles.inputListening,
        ]}
        editable={!isListening}
        {...props}
      />

      {isListening && (
        <Text style={styles.listeningHint}>
          Appuyez sur le micro pour arreter
        </Text>
      )}

      {voiceError && <Text style={styles.errorText}>{voiceError}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  voiceButtonActive: {
    backgroundColor: COLORS.red[500],
    borderColor: COLORS.red[500],
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.gray[900],
    textAlignVertical: 'top',
  },
  multiline: {
    minHeight: 100,
  },
  inputError: {
    borderColor: COLORS.red[500],
  },
  inputListening: {
    borderColor: COLORS.primary[500],
    backgroundColor: COLORS.primary[50],
  },
  listeningHint: {
    fontSize: 12,
    color: COLORS.primary[600],
    marginTop: 6,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.red[600],
    marginTop: 6,
  },
});
