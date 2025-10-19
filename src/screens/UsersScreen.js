import React, { useEffect, useState } from 'react';
import { SafeAreaView, FlatList, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

const SERVER_URL = 'https://podiumapp.site/server/users';

export default function UsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await axios.get(SERVER_URL);
        console.log("Data of users is ", res.data)
        setUsers(res.data.data);
      } catch (err) {
        Alert.alert('Error', 'Unable to fetch users.');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 12 }}>
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.user_id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('UserDetail', { user: item })}
            style={{ padding: 12, borderBottomWidth: 1, borderColor: '#ddd' }}
          >
            <Text style={{ fontSize: 16 }}>{item.name}</Text>
            <Text style={{ color: '#666' }}>{item.email}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
