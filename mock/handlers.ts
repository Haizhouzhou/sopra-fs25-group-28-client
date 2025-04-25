// mock/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // 模拟轮询接口
  rest.get('/poll/:id', (req, res, ctx) => {
    const { id } = req.params;
    const pid = req.url.searchParams.get('pid');
    const uuid = req.url.searchParams.get('uuid');
    console.log('[MSW] GET /poll/:id matched!', req.url.toString());
    return res(
      ctx.status(200),
      ctx.json({
        state: {
          log: [
            {
              pid: Number(pid) || 0,
              msg: `Poll response for game ${id}`,
              time: Date.now()
            }
          ],
          players: [
            {
              id: Number(pid) || 0,
              name: 'Alice',
              uuid: uuid || 'test-uuid',
              reserved: [],
              nobles: [],
              cards: {},
              gems: { r: 1, b: 2 },
              score: 4
            }
          ],
          cards: { level1: [], level2: [], level3: [] },
          decks: { level1: 10, level2: 5, level3: 2 },
          nobles: [],
          gems: { r: 4, b: 3, g: 2, u: 1, w: 0, '*': 1 },
          turn: Number(pid) || 0,
          winner: null
        },
        chat: [
          {
            time: Date.now(),
            pid: Number(pid) || 0,
            name: 'Alice',
            msg: 'Hello from mock!'
          }
        ]
      })
    );
  }),

  // 模拟获取初始状态接口
  rest.get('/stat/:id', (req, res, ctx) => {
    const pid = req.url.searchParams.get('pid');
    const uuid = req.url.searchParams.get('uuid');
    console.log('[MSW] GET /stat/:id matched!', req.url.toString());
    return res(
      ctx.status(200),
      ctx.json({
        state: {
          log: [],
          players: [
            {
              id: Number(pid) || 0,
              name: 'Alice',
              uuid: uuid || 'test-uuid',
              reserved: [],
              nobles: [],
              cards: {},
              gems: { r: 1, b: 2 },
              score: 4
            }
          ],
          cards: { level1: [], level2: [], level3: [] },
          decks: { level1: 10, level2: 5, level3: 2 },
          nobles: [],
          gems: { r: 4, b: 3, g: 2, u: 1, w: 0, '*': 1 },
          turn: Number(pid) || 0,
          winner: null
        },
        chat: []
      })
    );
  }),

  // 模拟 POST 操作接口
  rest.post('/game/:id/:action/:target', async (req, res, ctx) => {
    const { id, action, target } = req.params;
    const body = await req.json();
    console.log(`[MSW] POST /game/${id}/${action}/${target} with body:`, body);
    return res(
      ctx.status(200),
      ctx.json({
        result: {
          message: `Action ${action} on ${target} processed`
        },
        state: {
          log: [
            {
              pid: 0,
              msg: `Performed ${action} on ${target}`,
              time: Date.now()
            }
          ],
          players: [],
          cards: {},
          decks: {},
          nobles: [],
          gems: {},
          turn: 0,
          winner: null
        },
        chat: []
      })
    );
  })
];
