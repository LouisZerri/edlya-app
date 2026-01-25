import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';

interface PhotoCaptionEditorProps {
  visible: boolean;
  currentCaption: string;
  onSave: (caption: string) => void;
  onClose: () => void;
}

export function PhotoCaptionEditor({
  visible,
  currentCaption,
  onSave,
  onClose,
}: PhotoCaptionEditorProps) {
  const [caption, setCaption] = useState(currentCaption);

  useEffect(() => {
    if (visible) {
      setCaption(currentCaption);
    }
  }, [visible, currentCaption]);

  const handleSave = () => {
    onSave(caption.trim());
  };

  const handleCancel = () => {
    setCaption(currentCaption);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={handleCancel} />

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
              <X size={24} color={COLORS.gray[600]} />
            </TouchableOpacity>

            <Text style={styles.title}>Legende</Text>

            <TouchableOpacity
              onPress={handleSave}
              style={styles.headerButton}
            >
              <Check size={24} color={COLORS.primary[600]} />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Ajouter une description..."
            placeholderTextColor={COLORS.gray[400]}
            multiline
            numberOfLines={4}
            style={styles.input}
            autoFocus
            textAlignVertical="top"
          />

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.button, styles.saveButton]}
            >
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    marginBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.gray[900],
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[100],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  saveButton: {
    backgroundColor: COLORS.primary[600],
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
