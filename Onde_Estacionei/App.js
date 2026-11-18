import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Barometer } from 'expo-sensors';

const STORAGE_KEY = '@onde_estacionei/parking';
const GOLD = '#D6AA45';
const DEFAULT_REGION = { latitude: -23.55052, longitude: -46.633308, latitudeDelta: 0.012, longitudeDelta: 0.012 };

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false })
});

function distanceMeters(a, b) {
  if (!a || !b) return null;
  const rad = n => n * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const x = Math.sin(dLat/2)**2 + Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}
function fmt(ms) {
  if (ms == null) return '--:--:--';
  const total = Math.max(0, Math.floor(ms/1000));
  return [Math.floor(total/3600), Math.floor((total%3600)/60), total%60].map(n=>String(n).padStart(2,'0')).join(':');
}
function Card({title, children}) { return <View style={s.card}><Text style={s.cardTitle}>{title}</Text>{children}</View>; }
function Action({title, onPress, secondary=false}) { return <TouchableOpacity onPress={onPress} style={[s.action, secondary && s.secondary]}><Text style={[s.actionText, secondary && s.secondaryText]}>{title}</Text></TouchableOpacity>; }

export default function App() {
  const [parking, setParking] = useState(null);
  const [current, setCurrent] = useState(null);
  const [minutes, setMinutes] = useState('120');
  const [floor, setFloor] = useState('');
  const [pressureAltitude, setPressureAltitude] = useState(null);
  const [barometerAvailable, setBarometerAvailable] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { const parsed = JSON.parse(saved); setParking(parsed); setFloor(parsed.floor || ''); }
        catch { await AsyncStorage.removeItem(STORAGE_KEY); }
      }
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') console.log('Permissão de notificações não concedida.');
      const loc = await Location.requestForegroundPermissionsAsync();
      if (loc.status === 'granted') {
        const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrent({latitude:p.coords.latitude, longitude:p.coords.longitude});
      }
      const available = await Barometer.isAvailableAsync();
      setBarometerAvailable(available);
      if (available) {
        Barometer.setUpdateInterval(3000);
        const sub = Barometer.addListener(({pressure}) => {
          // Estimativa aproximada em relação à pressão padrão ao nível do mar.
          const altitude = 44330 * (1 - Math.pow(pressure / 1013.25, 0.1903));
          setPressureAltitude(Math.round(altitude));
        });
        return () => sub.remove();
      }
    })();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = parking?.expiresAt ? parking.expiresAt - now : null;
  const dist = useMemo(() => distanceMeters(current, parking), [current, parking]);

  async function persist(next) {
    setParking(next);
    if (next) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  }

  async function saveParking() {
    if (busy) return;
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Localização necessária', 'Autorize o acesso à localização para registrar a vaga.'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const duration = Math.max(1, Number(minutes) || 120);
      const expiresAt = Date.now() + duration * 60000;
      const next = { latitude:pos.coords.latitude, longitude:pos.coords.longitude, savedAt:Date.now(), expiresAt, floor:floor.trim(), altitude:pressureAltitude };
      await persist(next);
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (duration > 10) {
        await Notifications.scheduleNotificationAsync({
          content: { title:'Seu estacionamento está perto de vencer', body:'Faltam 10 minutos para o horário informado terminar.', sound:true },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(expiresAt - 10*60000) }
        });
      }
      setCurrent({latitude:pos.coords.latitude, longitude:pos.coords.longitude});
      Alert.alert('Estacionamento salvo!', 'A localização do veículo foi registrada.');
    } catch (e) { Alert.alert('Não foi possível salvar', String(e?.message || e)); }
    finally { setBusy(false); }
  }

  async function refreshLocation() {
    try {
      const p = await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
      setCurrent({latitude:p.coords.latitude, longitude:p.coords.longitude});
    } catch { Alert.alert('GPS indisponível', 'Verifique se a localização está ativada.'); }
  }
  function openWalkingRoute() {
    if (!parking) return;
    const url = Platform.select({
      android: `google.navigation:q=${parking.latitude},${parking.longitude}&mode=w`,
      ios: `http://maps.apple.com/?daddr=${parking.latitude},${parking.longitude}&dirflg=w`
    });
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${parking.latitude},${parking.longitude}&travelmode=walking`));
  }
  async function clearParking() {
    Alert.alert('Remover estacionamento?', 'Isso apagará a localização e o temporizador salvos.', [
      {text:'Cancelar', style:'cancel'},
      {text:'Remover', style:'destructive', onPress:async()=>{await Notifications.cancelAllScheduledNotificationsAsync(); await persist(null); setFloor('');}}
    ]);
  }
  const region = parking ? {latitude:parking.latitude,longitude:parking.longitude,latitudeDelta:0.006,longitudeDelta:0.006} : current ? {...current,latitudeDelta:0.012,longitudeDelta:0.012} : DEFAULT_REGION;

  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle="light-content" />
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.eyebrow}>MOBILIDADE • UTILIDADE</Text>
      <Text style={s.title}>Onde <Text style={{color:GOLD}}>Estacionei?</Text></Text>
      <Text style={s.subtitle}>Seu carro sempre ao alcance de um mapa.</Text>

      <Card title="LOCALIZAÇÃO DO VEÍCULO">
        <View style={s.mapWrap}>
          <MapView style={s.map} region={region} showsUserLocation={!!current} showsMyLocationButton>
            {parking && <Marker coordinate={{latitude:parking.latitude,longitude:parking.longitude}} title="Seu veículo" description={parking.floor ? `Andar: ${parking.floor}` : 'Local onde você estacionou'} pinColor={GOLD} />}
          </MapView>
        </View>
        {parking ? <>
          <Text style={s.info}>Latitude: {parking.latitude.toFixed(6)}  •  Longitude: {parking.longitude.toFixed(6)}</Text>
          <Text style={s.info}>Salvo em: {new Date(parking.savedAt).toLocaleString()}</Text>
          <Action title="TRAÇAR ROTA A PÉ ATÉ O VEÍCULO" onPress={openWalkingRoute}/>
          <Action title="ATUALIZAR MINHA POSIÇÃO" onPress={refreshLocation} secondary/>
        </> : <Text style={s.muted}>Nenhum estacionamento salvo. Estacione e toque no botão abaixo.</Text>}
      </Card>

      <Card title="REGISTRAR ESTACIONAMENTO">
        <Text style={s.label}>Tempo contratado (minutos)</Text>
        <TextInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad" placeholder="Ex.: 120" placeholderTextColor="#777" style={s.input}/>
        <Text style={s.label}>Andar / setor / vaga (opcional)</Text>
        <TextInput value={floor} onChangeText={setFloor} placeholder="Ex.: G2 • Setor Azul • Vaga 18" placeholderTextColor="#777" style={s.input}/>
        <Action title={busy ? 'SALVANDO...' : 'SALVAR ONDE ESTACIONEI'} onPress={saveParking}/>
        <Text style={s.hint}>O GPS registra as coordenadas atuais. O tempo começa a contar ao salvar.</Text>
      </Card>

      <Card title="TEMPO RESTANTE">
        <Text style={[s.countdown, remaining !== null && remaining <= 600000 && {color:'#FF806F'}]}>{parking ? fmt(remaining) : '--:--:--'}</Text>
        <Text style={s.muted}>{!parking ? 'Salve um estacionamento para iniciar.' : remaining <= 0 ? 'O tempo informado terminou.' : 'Contagem regressiva até o vencimento.'}</Text>
        {parking && <Text style={s.info}>Vencimento: {new Date(parking.expiresAt).toLocaleString()}</Text>}
      </Card>

      <Card title="DISTÂNCIA E NÍVEL">
        <Text style={s.metric}>{dist == null ? '—' : `${Math.round(dist)} m`}</Text>
        <Text style={s.muted}>Distância aproximada em linha reta entre sua posição e o veículo.</Text>
        <View style={s.line}/>
        <Text style={s.info}>Barômetro: {barometerAvailable ? (pressureAltitude == null ? 'Lendo sensor...' : `altitude estimada: ${pressureAltitude} m`) : 'Não disponível neste aparelho.'}</Text>
        <Text style={s.info}>Andar / setor salvo: {parking?.floor || 'Não informado'}</Text>
        <Text style={s.hint}>A altitude do barômetro é aproximada e depende das condições atmosféricas; use o campo manual para identificar o andar do estacionamento.</Text>
      </Card>

      {parking && <Action title="APAGAR ESTACIONAMENTO SALVO" onPress={clearParking} secondary/>}
      <Text style={s.footer}>PROJETO ACADÊMICO • REACT NATIVE + EXPO</Text>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
 safe:{flex:1,backgroundColor:'#101114'}, container:{padding:18,paddingBottom:36},
 eyebrow:{color:GOLD,fontSize:11,fontWeight:'800',letterSpacing:2,marginTop:12},
 title:{color:'#F5F2EA',fontSize:32,fontWeight:'900',marginTop:7}, subtitle:{color:'#A6A6A6',fontSize:14,marginBottom:18},
 card:{backgroundColor:'#1B1C20',borderColor:'#33343A',borderWidth:1,borderRadius:16,padding:15,marginBottom:14},
 cardTitle:{color:GOLD,fontSize:12,fontWeight:'900',letterSpacing:1.2,marginBottom:13},
 mapWrap:{height:220,borderRadius:12,overflow:'hidden',marginBottom:12},map:{flex:1},
 info:{color:'#D4D4D4',fontSize:12,marginTop:6}, muted:{color:'#999AA1',fontSize:13,lineHeight:19},
 label:{color:'#E7E7E7',fontSize:12,fontWeight:'700',marginTop:8,marginBottom:7},
 input:{backgroundColor:'#101114',borderWidth:1,borderColor:'#414249',borderRadius:10,color:'#FFF',paddingHorizontal:12,paddingVertical:11,marginBottom:9},
 action:{backgroundColor:GOLD,borderRadius:10,padding:14,alignItems:'center',marginTop:12},
 actionText:{color:'#171717',fontWeight:'900',fontSize:12,letterSpacing:.5},
 secondary:{backgroundColor:'transparent',borderWidth:1,borderColor:'#666'},
 secondaryText:{color:'#E8E8E8'},
 hint:{color:'#898A90',fontSize:11,lineHeight:16,marginTop:10},
 countdown:{color:'#F5F2EA',fontSize:36,fontWeight:'900',fontVariant:['tabular-nums'],marginVertical:4},
 metric:{color:'#F5F2EA',fontSize:30,fontWeight:'900'},line:{height:1,backgroundColor:'#393A40',marginVertical:13},
 footer:{color:'#65666D',fontSize:10,textAlign:'center',letterSpacing:1,marginTop:8}
});
