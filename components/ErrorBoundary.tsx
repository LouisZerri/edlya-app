import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/constants';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>😵</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.gray[800], marginBottom: 8, textAlign: 'center' }}>
            Oups, une erreur est survenue
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.gray[500], marginBottom: 24, textAlign: 'center' }}>
            L'application a rencontré un problème inattendu.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            style={{
              backgroundColor: COLORS.primary[600],
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Relancer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
