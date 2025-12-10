import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import crashlytics from "@react-native-firebase/crashlytics";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

/**
 * A React Error Boundary component for catching runtime errors in child components.
 *
 * This component:
 * - Catches JavaScript errors anywhere in its child component tree
 * - Logs the errors to Firebase Crashlytics
 * - Displays a fallback UI with the error message
 * - Provides a "Reload App" button to reset the error state
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 * ```
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {React.ReactNode} The children if no error, or the fallback UI if an error occurred
 */

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    crashlytics().log("React Error Boundary caught an error");
    crashlytics().recordError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong.</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>

          <Button
            title="Reload App"
            onPress={() => this.setState({ hasError: false })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  message: {
    textAlign: "center",
    marginBottom: 20,
  },
});
