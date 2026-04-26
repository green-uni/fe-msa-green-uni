import axios from './httpRequester';

const path = '/lectures';

class AttendanceService {

    //출결정보가져오기
    async getAttendList(lectureId, attendDate) {
        const res = await axios.get(`${path}/${lectureId}/attendance`, {
            params: { attendDate }
        });
        return res.data.result;
    }

    //출결저장 후 내 강의로 다시 돌아가기
    async getLectureId(lectureId) {
        const res = await axios.get(`${path}/${lectureId}`);
        return res.data.result;
    }

    //출결수정
    async updateAttendList(lectureId, req) {
        const res = await axios.patch(`${path}/${lectureId}/attendance`, req);
        return res.data;
    }

    //출석한 날짜 연두색으로 표시하기위해 사용
    async getRecordedDates(lectureId) {
        const res = await axios.get(`${path}/${lectureId}/attendance/dates`);
        return res.data.result;
    }

}

export default new AttendanceService();