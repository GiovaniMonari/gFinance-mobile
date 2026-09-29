
import { useEffect, useRef } from 'react'
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native'

type AppLoadingProps = {
  message?: string
  description?: string
}

export function AppLoading({
  message = 'Organizando seus dados',
  description = 'Isso leva só um momento',
}: AppLoadingProps) {
  const pulse = useRef(
    new Animated.Value(0.75),
  ).current

  const dot1 = useRef(
    new Animated.Value(0.35),
  ).current

  const dot2 = useRef(
    new Animated.Value(0.35),
  ).current

  const dot3 = useRef(
    new Animated.Value(0.35),
  ).current

  useEffect(() => {
    const pulseAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(
              Easing.ease,
            ),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0.75,
            duration: 900,
            easing: Easing.inOut(
              Easing.ease,
            ),
            useNativeDriver: true,
          }),
        ]),
      )

    const createDotAnimation = (
      value: Animated.Value,
      delay: number,
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),

          Animated.timing(value, {
            toValue: 1,
            duration: 350,
            easing: Easing.inOut(
              Easing.ease,
            ),
            useNativeDriver: true,
          }),

          Animated.timing(value, {
            toValue: 0.35,
            duration: 350,
            easing: Easing.inOut(
              Easing.ease,
            ),
            useNativeDriver: true,
          }),

          Animated.delay(500),
        ]),
      )

    pulseAnimation.start()

    const dot1Animation =
      createDotAnimation(dot1, 0)

    const dot2Animation =
      createDotAnimation(dot2, 180)

    const dot3Animation =
      createDotAnimation(dot3, 360)

    dot1Animation.start()
    dot2Animation.start()
    dot3Animation.start()

    return () => {
      pulseAnimation.stop()
      dot1Animation.stop()
      dot2Animation.stop()
      dot3Animation.stop()
    }
  }, [pulse, dot1, dot2, dot3])

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: pulse,
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0.75, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={require('../../assets/logogFinance.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Text style={styles.message}>
        {message}
      </Text>

      <Text style={styles.description}>
        {description}
      </Text>

      <View style={styles.dots}>
        <Animated.View
          style={[
            styles.dot,
            { opacity: dot1 },
          ]}
        />

        <Animated.View
          style={[
            styles.dot,
            { opacity: dot2 },
          ]}
        />

        <Animated.View
          style={[
            styles.dot,
            { opacity: dot3 },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fb',
    paddingHorizontal: 30,
  },

  logoContainer: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },

  logo: {
    width: 72,
    height: 72,
  },

  message: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
  },

  description: {
    marginTop: 6,
    fontSize: 12,
    color: '#98a2b3',
    textAlign: 'center',
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 18,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
})
