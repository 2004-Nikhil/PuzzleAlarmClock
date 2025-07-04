import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import _ from 'lodash'; // You may need to run: npm install lodash @types/lodash
interface Card {
    id: number;
    value: string;
    isFlipped: boolean;
    isMatched: boolean;
}
interface MemoryGameProps {
    pairs: number;
    onChallengeComplete: () => void;
}
const EMOJIS = ['🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🥝', '🍍', '🥥', '🍑', '🍒', '🥭'];
const generateCards = (pairs: number): Card[] => {
    if (pairs > EMOJIS.length) {
        console.warn(`Requested ${pairs} pairs, but only ${EMOJIS.length} are available.`);
        pairs = EMOJIS.length;
    }
    const selectedEmojis = EMOJIS.slice(0, pairs);
    const deck = [...selectedEmojis, ...selectedEmojis];
    const shuffledDeck = _.shuffle(deck);
    return shuffledDeck.map((emoji, index) => ({
        id: index,
        value: emoji,
        isFlipped: false,
        isMatched: false,
    }));
};
const MemoryGame = ({ pairs, onChallengeComplete }: MemoryGameProps) => {
    const [cards, setCards] = useState(() => generateCards(pairs));
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleCardFlip = (index: number) => {
        if (flippedIndices.length === 2 || cards[index].isFlipped) {
            return; // Prevent flipping more than 2 cards or an already flipped card
        }
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);
        setFlippedIndices([...flippedIndices, index]);
    };
    useEffect(() => {
        if (flippedIndices.length === 2) {
            const [firstIndex, secondIndex] = flippedIndices;
            const firstCard = cards[firstIndex];
            const secondCard = cards[secondIndex];
            if (firstCard.value === secondCard.value) {
                // It's a match
                const newCards = [...cards];
                newCards[firstIndex].isMatched = true;
                newCards[secondIndex].isMatched = true;
                setCards(newCards);
                setFlippedIndices([]);

                // Check for win condition
                const allMatched = newCards.every(card => card.isMatched);
                if (allMatched) {
                    Alert.alert("Congratulations!", "You've matched all the cards.", [
                        { text: "OK", onPress: onChallengeComplete }
                    ]);
                }
            } else {
                // Not a match, flip them back after a delay
                timeoutRef.current = setTimeout(() => {
                    const newCards = [...cards];
                    newCards[firstIndex].isFlipped = false;
                    newCards[secondIndex].isFlipped = false;
                    setCards(newCards);
                    setFlippedIndices([]);
                }, 1000);
            }
        }
        // Cleanup timeout on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [flippedIndices, cards, onChallengeComplete]);
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Match the Pairs</Text>
            <FlatList
                data={cards}
                keyExtractor={item => item.id.toString()}
                numColumns={4} // Adjust based on screen size/pairs
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        style={[styles.card, item.isFlipped ? styles.cardFlipped : styles.cardHidden]}
                        onPress={() => handleCardFlip(index)}
                        disabled={item.isFlipped}
                    >
                        {item.isFlipped && (
                            <Text style={styles.cardText}>{item.value}</Text>
                        )}
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};
const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginVertical: 20 },
    listContent: { justifyContent: 'center', alignItems: 'center' },
    card: {
        width: 60,
        height: 80,
        margin: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    cardHidden: { backgroundColor: '#007aff' },
    cardFlipped: { backgroundColor: '#fff' },
    cardText: { fontSize: 30 },
});
export default MemoryGame;
