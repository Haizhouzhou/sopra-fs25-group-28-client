"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import Image from "next/image"; // 导入 Next.js 的 Image 组件
import type { UserListGetDTO } from "@/types/user";

// Backend response data structure
interface LeaderboardEntryDTO {
  playerId: number;
  wins: number;
}

// Frontend display data structure
interface LeaderboardDisplayData {
  playerId: number;
  avatar: string;
  username: string;
  wincounter: number;
}


const Leaderboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: currentUser } = useLocalStorage<UserListGetDTO>("currentUser", {} as UserListGetDTO);
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardDisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 处理数据加载
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const leaderboardEntries = await apiService.get<UserListGetDTO[]>("/users/leaderboard");

        
        // 如果没有数据，使用mock数据
        if (!Array.isArray(leaderboardEntries) || leaderboardEntries.length === 0) {
          setLeaderboardData(getMockLeaderboardData());
          setIsLoading(false);
          return;
        }
        
        // 获取用户数据
        const users = await apiService.get<UserListGetDTO[]>("/users");
        
        // 合并数据
        const processedData: LeaderboardDisplayData[] = leaderboardEntries.map(user => ({
        playerId: user.id,
        avatar: user.avatar || "a_01.png",
        username: user.username || "Unknown",
        wincounter: user.wincounter || 0
        }));


        
        // 排序
        processedData.sort((a, b) => b.wincounter - a.wincounter);

        setLeaderboardData(processedData);
      } catch (err) {
        console.error("Error loading leaderboard data:", err);
        setError(typeof err === 'string' ? err : err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [apiService]); // 添加 apiService 作为依赖项

  // Mock data for demonstration
  const getMockLeaderboardData = (): LeaderboardDisplayData[] => {
    return [
      {
        playerId: 999,
        avatar: "a_07.png",
        username: "Test_Champion123",
        wincounter: 15
      },
      {
        playerId: 888,
        avatar: "a_08.png",
        username: "Test_ProGamer",
        wincounter: 10
      }
    ];
  };

  const handleBackToLobby = () => {
    router.push("/lobby");
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* Background image*/}
      <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
        <Image
          src="/gamesource/tile_background.png"
          alt="Background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      {/* Logo in top left*/}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
        <Image
          src="/gamesource/splendor_logo.png"
          alt="Logo"
          width={500}
          height={200}
          priority
        />
      </div>

      {/* Content area */}
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', padding: '200px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <h1 style={{ color: '#FFD700', fontSize: '2.5rem' }}>Leaderboard</h1>
          
          {/* User info*/}
          {currentUser && currentUser.id && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ position: 'relative', width: 60, height: 60 }}>
                <Image
                  src={`/avatar/${currentUser.avatar || 'a_01.png'}`}
                  alt="Avatar"
                  width={60}
                  height={60}
                  style={{ borderRadius: '50%', border: '3px solid #FFD700' }}
                />
              </div>
              <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1.3rem' }}>{currentUser.name}</span>
            </div>
          )}
        </div>

        {/* Error message display */}
        {error && (
          <div style={{ padding: 20, textAlign: 'center', color: 'red', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Leaderboard table */}
        <div style={{ backgroundColor: 'rgba(15, 33, 73, 0.7)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          {/* Table header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '0.5fr 1fr 2fr 1fr', 
            borderBottom: '1px solid #FFD700', 
            padding: '8px 0', 
            color: '#FFD700', 
            fontWeight: 'bold' 
          }}>
            <div>Rank</div>
            <div>Avatar</div>
            <div>Username</div>
            <div>Wins</div>
          </div>

          {/* Leaderboard data */}
          {isLoading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'white' }}>
              Loading leaderboard data...
            </div>
          ) : leaderboardData.length > 0 ? (
            leaderboardData.map((player, index) => (
              <div 
                key={player.playerId} 
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.5fr 1fr 2fr 1fr',
                  padding: '12px 0',
                  color: 'white',
                  backgroundColor: player.playerId === currentUser?.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{index + 1}</div>
                <div style={{ position: 'relative', width: 40, height: 40 }}>
                  <Image
                    src={`/avatar/${player.avatar}`}
                    alt="Avatar"
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%', border: '2px solid #FFD700' }}
                  />
                </div>
                <div>{player.username}</div>
                <div>{player.wincounter}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'white' }}>
              No leaderboard data available. Win games to appear here!
            </div>
          )}
        </div>

        {/* Button area */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={handleBackToLobby} 
            style={{
              backgroundColor: '#0F2149',
              border: '2px solid #FFD700',
              color: '#FFD700',
              padding: '12px 30px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            BACK TO LOBBY
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;